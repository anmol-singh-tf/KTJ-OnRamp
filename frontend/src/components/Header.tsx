import { Wallet } from "lucide-react";

const Header = () => {
  return (
    <header className="glass-strong sticky top-0 z-50 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Bio-Wallet
          </h1>
        </div>

        {/* Status Badge */}
        <div className="status-badge">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Connected: Polygon Amoy
        </div>
      </div>
    </header>
  );
};

export default Header;
