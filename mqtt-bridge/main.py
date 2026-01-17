import os
import json
import logging
import ssl
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import paho.mqtt.client as mqtt

# --- CHARGEMENT DU .ENV ---
# En Docker, ces variables sont injectées automatiquement depuis le fichier .env
DATABASE_URL = os.getenv("DATABASE_URL")
MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_TOPIC = os.getenv("MQTT_TOPIC")

CA_CERT_PATH = os.getenv("CA_CERT_PATH", "/app/certs/ca.pem")
CLIENT_CERT_PATH = os.getenv("CLIENT_CERT_PATH", "/app/certs/client-csr.pem")
CLIENT_KEY_PATH = os.getenv("CLIENT_KEY_PATH", "/app/certs/client-csr-key.pem")

# Configuration Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TelemetryBridge")

# --- VALIDATION DES VARIABLES OBLIGATOIRES ---
if not DATABASE_URL:
    logger.critical("DATABASE_URL n'est pas défini")
    exit(1)

if not MQTT_BROKER:
    logger.critical("MQTT_BROKER n'est pas défini")
    exit(1)

if not MQTT_TOPIC:
    logger.critical("MQTT_TOPIC n'est pas défini")
    exit(1)

# --- DATABASE SETUP (PostgreSQL + TimescaleDB) ---
engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(bind=engine)

def get_sensor_metadata(session, dev_eui):
    """Récupère l'ID, le plot et l'organisation via le DevEUI (serial_number)."""
    query = text("""
        SELECT id, plot_id, organization_id FROM sensors 
        WHERE (serial_number = :dev_eui OR mac_address = :dev_eui) 
        AND is_active = true LIMIT 1
    """)
    return session.execute(query, {"dev_eui": dev_eui}).fetchone()

def on_connect(client, userdata, flags, rc):
    """Callback de connexion MQTT."""
    if rc == 0:
        logger.info(f"Connecté avec succès au Broker Azure via TLS")
        client.subscribe(MQTT_TOPIC)
        logger.info(f"Abonné au topic : {MQTT_TOPIC}")
    else:
        logger.error(f"Erreur de connexion MQTT, code : {rc}")

def process_message(client, userdata, msg):
    """Traitement et insertion dans les hypertables."""
    session = SessionLocal()
    try:
        # 1. Parsing du JSON Chirpstack
        payload = json.loads(msg.payload.decode('utf-8'))
        dev_eui = payload.get('deviceInfo', {}).get('devEui') or payload.get('devEUI')
        object_payload = payload.get('object', {})
        logger.info(f"Received message from {dev_eui}: {object_payload}")

        if not dev_eui:
            return

        # 2. Récupération des relations en BDD
        sensor = get_sensor_metadata(session, dev_eui)
        if not sensor:
            logger.warning(f"Capteur {dev_eui} ignoré : non présent en base.")
            return

        sensor_id, plot_id, org_id = sensor
        # Utilisation du timestamp du message ou heure actuelle
        # TimescaleDB nécessite impérativement une colonne 'time' non nulle
        timestamp = datetime.now() 

        # 3. Insertion dans 'uplink_telemetry' (Table Brute/Historique)
        session.execute(
            text("""
                INSERT INTO uplink_telemetry (time, sensor_id, dev_eui, f_port, rssi, snr, payload)
                VALUES (:t, :sid, :deui, :port, :rssi, :snr, :pay)
            """),
            {
                "t": timestamp, "sid": sensor_id, "deui": dev_eui,
                "port": payload.get('fPort'),
                "rssi": payload.get('rxInfo', [{}])[0].get('rssi'),
                "snr": payload.get('rxInfo', [{}])[0].get('snr'),
                "pay": json.dumps(object_payload)
            }
        )

        # 4. Insertion dans 'soil_readings' (Table Métier/Front)
        # On vérifie la présence d'au moins une donnée sol avant d'insérer
        soil_keys = ['moisture', 'temperature', 'ph', 'ec', 'nitrogen', 'phosphorus', 'potassium']
        if any(k in object_payload for k in soil_keys):
            session.execute(
                text("""
                    INSERT INTO soil_readings (
                        time, sensor_id, plot_id, moisture, temperature, ec, ph, 
                        nitrogen, phosphorus, potassium
                    ) VALUES (
                        :t, :sid, :pid, :m, :temp, :ec, :ph, :n, :p, :k
                    )
                """),
                {
                    "t": timestamp, "sid": sensor_id, "pid": plot_id,
                    "m": object_payload.get('moisture'),
                    "temp": object_payload.get('temperature'),
                    "ec": object_payload.get('ec'),
                    "ph": object_payload.get('ph'),
                    "n": object_payload.get('nitrogen'),
                    "p": object_payload.get('phosphorus'),
                    "k": object_payload.get('potassium')
                }
            )
            logger.info(f"Lecture insérée pour {dev_eui} sur le plot {plot_id}")

        session.commit()

    except Exception as e:
        session.rollback()
        logger.error(f"Erreur d'insertion : {e}")
    finally:
        session.close()

# --- INITIALISATION MQTT ---
client = mqtt.Client()

# Configuration TLS (vérifie l'existence des certificats)
use_tls = True
cert_files = {
    "CA": CA_CERT_PATH,
    "Client Cert": CLIENT_CERT_PATH,
    "Client Key": CLIENT_KEY_PATH
}

# Vérifier l'existence des certificats
missing_certs = []
for cert_name, cert_path in cert_files.items():
    if not os.path.exists(cert_path):
        missing_certs.append(f"{cert_name} ({cert_path})")
        use_tls = False

if use_tls:
    try:
        logger.info("Configuration TLS avec certificats...")
        client.tls_set(
            ca_certs=CA_CERT_PATH,
            certfile=CLIENT_CERT_PATH,
            keyfile=CLIENT_KEY_PATH,
            tls_version=ssl.PROTOCOL_TLSv1_2
        )
        logger.info("TLS configuré avec succès")
    except Exception as e:
        logger.error(f"Erreur lors de la configuration TLS : {e}")
        logger.error("Tentative de connexion sans TLS...")
        use_tls = False
else:
    logger.warning("Certificats TLS non trouvés:")
    for cert_info in missing_certs:
        logger.warning(f"  - {cert_info}")
    logger.warning("Le service attendra la configuration des certificats avant de démarrer.")

if not use_tls:
    logger.critical("Impossible de démarrer sans certificats TLS. Veuillez configurer les certificats dans mqtt-bridge/certs/")
    logger.critical("Fichiers requis:")
    logger.critical(f"  - CA Certificate: {CA_CERT_PATH}")
    logger.critical(f"  - Client Certificate: {CLIENT_CERT_PATH}")
    logger.critical(f"  - Client Key: {CLIENT_KEY_PATH}")
    exit(1)

client.on_connect = on_connect
client.on_message = process_message

try:
    logger.info("Démarrage du Bridge...")
    logger.info(f"Connexion au broker: {MQTT_BROKER}:{MQTT_PORT}")
    logger.info(f"Topic: {MQTT_TOPIC}")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()
except Exception as e:
    logger.critical(f"Impossible de démarrer le service : {e}")
    exit(1)