import { Navigate } from "react-router-dom";
import Landing from "../pages/Landing";

const PublicIndex = () => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  if (userInfo?.token) {
    return <Navigate to="/panel" replace />;
  }

  return <Landing />;
};

export default PublicIndex;
