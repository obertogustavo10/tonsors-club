import { useNavigate, useLocation } from "react-router-dom";

const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const goTo = (path, state = {}) => {
    navigate(path, { state });
  };
  const goBack = () => {
    navigate(-1);
  };
  const isCurrentPath = (path) => {
    return location.pathname === path;
  };
  return { goTo, goBack, isCurrentPath, location };
};

export default useNavigation;
