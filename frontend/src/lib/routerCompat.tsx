import React from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string;
  to?: string;
  children?: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export const Link: React.FC<LinkProps> = ({ href, to, children, ...props }) => {
  const targetPath = to || href || '';
  return (
    <RouterLink to={targetPath} {...(props as any)}>
      {children}
    </RouterLink>
  );
};

export default Link;

export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: () => {},
  };
};

export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

export const useSearchParams = () => {
  const location = useLocation();
  return new URLSearchParams(location.search);
};

export { useNavigate, useLocation };
