import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { logout as logoutThunk } from '../store/slices/auth';

// Use throughout app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth hook
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const logout = async () => {
    await dispatch(logoutThunk());
    localStorage.removeItem('auth_tokens');
  };

  return {
    user: auth.user,
    tokens: auth.tokens,
    isLoading: auth.isLoading,
    error: auth.error,
    isAuthenticated: !!auth.tokens,
    isAdmin: auth.user?.role === 'orgadmin' || auth.user?.role === 'superadmin',
    dispatch,
    logout,
  };
};
