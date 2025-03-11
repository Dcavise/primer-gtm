import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const handleBackClick = () => {
    if (location.pathname.includes("/real-estate-pipeline/property/")) {
      navigate("/real-estate-pipeline");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-anti-flash">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-eerie-black">404</h1>
        <p className="text-xl text-slate-gray mb-4">Oops! Page not found</p>
        <Button
          variant="default"
          onClick={handleBackClick}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to{" "}
          {location.pathname.includes("/real-estate-pipeline/property/")
            ? "Pipeline"
            : "Home"}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
