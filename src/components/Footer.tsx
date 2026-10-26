import "./Footer.css";

interface FooterProps {
  className?: string;
}

function Footer({ className }: FooterProps) {
  return (
    <footer
      className={
        className
          ? `app-footer ${className}`
          : "app-footer"
      }
    >
      © 2026 Airus
    </footer>
  );
}

export default Footer;
