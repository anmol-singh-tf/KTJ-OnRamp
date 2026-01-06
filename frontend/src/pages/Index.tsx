import { useState } from "react";
import { Scan, MessageSquare, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import ScanPayTab from "@/components/ScanPayTab";
import AIConciergeTab from "@/components/AIConciergeTab";
import RegisterTab from "@/components/RegisterTab";
import LoadingOverlay from "@/components/LoadingOverlay";
import SuccessOverlay from "@/components/SuccessOverlay";
import { toast } from "sonner";

type TabType = "register" | "scan" | "chat";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("register");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [logs, setLogs] = useState("");

  // App State
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // Payment form state
  const [receiverAddress, setReceiverAddress] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const handleRegister = async (user: string, file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('username', user);
    formData.append('fingerprint', file);

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setUsername(data.username);
        setWalletAddress(data.address);
        toast.success(`Wallet Created! Address: ${data.address.slice(0, 6)}...`);
        setActiveTab("scan"); // Move to Pay tab
      } else {
        toast.error(data.error || "Registration Failed");
      }
    } catch (e) {
      toast.error("Connection Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPayment = async (receiver: string, amount: string, file: File) => {
    if (!username) {
      toast.error("Please Register first!");
      setActiveTab("register");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('username', username);
    formData.append('receiver', receiver);
    formData.append('amount', amount);
    formData.append('fingerprint', file);

    try {
      const res = await fetch("http://localhost:5000/pay", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setTxHash(data.tx_hash);
        setLogs(data.logs);
        setShowSuccess(true);
        toast.success("Payment Successful!");
      } else {
        toast.error(data.message || data.error || "Payment Failed");
      }
    } catch (e) {
      toast.error("Connection Error during payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFill = (receiver: string, amount: string) => {
    setReceiverAddress(receiver);
    setPaymentAmount(amount);
    // Switch to scan tab to show filled fields
    setActiveTab("scan");
    toast.info("Payment details auto-filled by Agent");
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setReceiverAddress("");
    setPaymentAmount("");
    setTxHash("");
  };

  const tabs = [
    { id: "register" as const, label: "Register", icon: UserPlus },
    { id: "scan" as const, label: "Scan & Pay", icon: Scan },
    { id: "chat" as const, label: "AI Concierge", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="glass-strong p-1 rounded-2xl mb-6 inline-flex w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info Bar if Logged In */}
        {username && (
          <div className="glass p-4 mb-4 flex justify-between items-center animate-fade-in">
            <div className="text-sm">
              <span className="text-muted-foreground">User:</span> <span className="font-bold text-primary">{username}</span>
            </div>
            <div className="text-xs bg-secondary/20 px-2 py-1 rounded text-secondary-foreground font-mono">
              {walletAddress}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === "register" && (
            <RegisterTab onRegister={handleRegister} />
          )}
          {activeTab === "scan" && (
            <ScanPayTab
              onStartPayment={handleStartPayment}
              receiverAddress={receiverAddress}
              setReceiverAddress={setReceiverAddress}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
            />
          )}
          {activeTab === "chat" && (
            <AIConciergeTab onAutoFill={handleAutoFill} />
          )}
        </div>
      </main>

      {/* Overlays */}
      <LoadingOverlay isVisible={isLoading} />
      <SuccessOverlay
        isVisible={showSuccess}
        txHash={txHash}
        onClose={handleCloseSuccess}
      />
    </div>
  );
};

export default Index;
