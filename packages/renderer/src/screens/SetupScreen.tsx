import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, User, Key, Globe } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import "./SetupScreen.css";

type TAuthType = "profile" | "keys";

type SetupScreenProps = {
  onConnect: (config: any) => Promise<void>;
  isLoading: boolean;
  profiles: string[];
  initialConfig?: any;
  isModal?: boolean;
};

const SetupScreen: React.FC<SetupScreenProps> = ({
  onConnect,
  isLoading,
  profiles,
  initialConfig,
  isModal,
}) => {
  const [authType, setAuthType] = useState<TAuthType>(
    initialConfig?.authType || "profile",
  );
  const [selectedProfile, setSelectedProfile] = useState(
    initialConfig?.profile || profiles[0] || "default",
  );
  const [accessKeyId, setAccessKeyId] = useState(
    initialConfig?.accessKeyId || "",
  );
  const [secretAccessKey, setSecretAccessKey] = useState(
    initialConfig?.secretAccessKey || "",
  );
  const [region, setRegion] = useState(
    initialConfig?.region || "ap-northeast-2",
  );

  const handleConnect = () => {
    onConnect({
      authType,
      profile: selectedProfile,
      accessKeyId,
      secretAccessKey,
      region,
    });
  };

  const content = (
    <motion.div
      initial={isModal ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`setup-card ${isModal ? "in-modal" : ""}`}
    >
      <div className="setup-header">
        <Shield size={48} color="var(--primary)" />
        <h2>Connect to AWS</h2>
        <p>SSM Parameter Store Management</p>
      </div>

      <div className="auth-tabs">
        <button
          className={authType === "profile" ? "active" : ""}
          onClick={() => setAuthType("profile")}
        >
          Profile
        </button>
        <button
          className={authType === "keys" ? "active" : ""}
          onClick={() => setAuthType("keys")}
        >
          Access Keys
        </button>
      </div>

      <div className="auth-form">
        {authType === "profile" ? (
          <div className="input-group">
            <label>AWS Profile</label>
            <div className="select-wrapper">
              <User size={16} className="icon" />
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
              >
                {profiles.length > 0 ? (
                  profiles.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                ) : (
                  <option>No profiles found</option>
                )}
              </select>
            </div>
          </div>
        ) : (
          <div className="key-group">
            <Input
              label="Access Key ID"
              placeholder="AKIA..."
              icon={<Key size={16} />}
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
            />
            <Input
              label="Secret Access Key"
              type="password"
              placeholder="Enter secret key"
              icon={<Shield size={16} />}
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
            />
          </div>
        )}

        <div className="input-group">
          <label>Region</label>
          <div className="select-wrapper">
            <Globe size={16} className="icon" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="ap-northeast-2">서울 (ap-northeast-2)</option>
              <option value="ap-southeast-1">싱가포르 (ap-southeast-1)</option>
              <option value="us-east-1">미국 동부 (us-east-1)</option>
              <option value="us-west-2">미국 서부 (us-west-2)</option>
            </select>
          </div>
        </div>

        <Button
          className="connect-btn"
          size="lg"
          onClick={handleConnect}
          isLoading={isLoading}
        >
          Connect
        </Button>
      </div>
    </motion.div>
  );

  if (isModal) return content;

  return <div className="setup-container">{content}</div>;
};

export default SetupScreen;
