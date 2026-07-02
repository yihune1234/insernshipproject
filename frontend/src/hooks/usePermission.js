import useAuthStore from '../store/authStore';

const usePermission = (allowedRoles = []) => {
  const { role } = useAuthStore();
  return allowedRoles.includes(role);
};

export default usePermission;
