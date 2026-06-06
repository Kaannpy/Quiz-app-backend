const REDIRECT_DELAY = 1400;

export const performLogout = (onStart) => {
  if (onStart) onStart();

  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.removeItem("userInfo");
      window.location.href = "/";
      resolve();
    }, REDIRECT_DELAY);
  });
};

export const performAuthRedirect = (path, onStart) => {
  if (onStart) onStart();

  return new Promise((resolve) => {
    setTimeout(() => {
      window.location.href = path;
      resolve();
    }, REDIRECT_DELAY);
  });
};
