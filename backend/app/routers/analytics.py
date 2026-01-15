"""Rotas de analytics."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.analytics import PlotProductionSnapshot
from app.models.farm import Farm, Plot

router = APIRouter()


@router.get("/production")
async def get_production_analytics(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém analytics de produção da organização."""
    # Query base para plots da organização
    if current_user.is_superuser:
        plots = db.query(Plot).filter(Plot.deleted_at.is_(None)).all()
    else:
        plots = (
            db.query(Plot)
            .join(Farm)
            .filter(
                Farm.organization_id == current_user.organization_id,
                Plot.deleted_at.is_(None),
            )
            .all()
        )

    # Buscar último snapshot de cada plot
    snapshots = []
    for plot in plots:
        snapshot = (
            db.query(PlotProductionSnapshot)
            .filter(PlotProductionSnapshot.plot_id == plot.id)
            .order_by(PlotProductionSnapshot.snapshot_date.desc())
            .first()
        )
        if snapshot:
            snapshots.append({
                "plot_id": plot.id,
                "plot_name": plot.name,
                "plot_code": plot.code,
                "snapshot": snapshot,
            })

    # Calcular totais
    total_fruits = sum(s["snapshot"].total_fruits or 0 for s in snapshots)
    total_yield_kg = sum(float(s["snapshot"].estimated_yield_kg or 0) for s in snapshots)

    # Contagem por status
    status_count = {"ok": 0, "warning": 0, "critical": 0, "offline": 0}
    for s in snapshots:
        status = s["snapshot"].status or "ok"
        if status in status_count:
            status_count[status] += 1

    return {
        "total_plots": len(plots),
        "plots_with_data": len(snapshots),
        "total_fruits": total_fruits,
        "estimated_yield_kg": total_yield_kg,
        "estimated_yield_tons": total_yield_kg / 1000,
        "status_summary": status_count,
        "snapshots": snapshots,
    }


@router.get("/plots/{plot_id}/snapshots")
async def get_plot_snapshots(
    plot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    limit: int = 30,
):
    """Obtém snapshots de produção de um talhão."""
    # Verifica se plot existe e pertence à organização
    plot_query = db.query(Plot).filter(Plot.id == plot_id, Plot.deleted_at.is_(None))

    if not current_user.is_superuser:
        plot_query = plot_query.join(Farm).filter(
            Farm.organization_id == current_user.organization_id
        )

    plot = plot_query.first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado")

    snapshots = (
        db.query(PlotProductionSnapshot)
        .filter(PlotProductionSnapshot.plot_id == plot_id)
        .order_by(PlotProductionSnapshot.snapshot_date.desc())
        .limit(limit)
        .all()
    )

    return {
        "plot": {
            "id": plot.id,
            "name": plot.name,
            "code": plot.code,
        },
        "snapshots": snapshots,
    }
