import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sprout, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-6">
          <Sprout className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link to="/farm">
              <Home className="w-4 h-4 mr-2" />
              Ir para Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
