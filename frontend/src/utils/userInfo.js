export const getUserInfo = () =>
  JSON.parse(localStorage.getItem("userInfo") || "null");

export const setUserInfo = (data) => {
  const prev = getUserInfo();
  const merged = { ...prev, ...data };
  if (prev?.token && !merged.token) {
    merged.token = prev.token;
  }
  localStorage.setItem("userInfo", JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent("userInfoUpdated"));
  return merged;
};
