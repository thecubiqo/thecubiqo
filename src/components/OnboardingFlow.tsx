'use client';

import { useState } from 'react';

export interface OnboardingConfig {
  featureToggles: {
    agents: boolean;
    voiceMode: boolean;
    codeExecution: boolean;
    fileManagement: boolean;
    memory: boolean;
  };
  oauthConnections: {
    github: boolean;
    google: boolean;
    slack: boolean;
  };
}

interface OnboardingFlowProps {
  onComplete: (config: OnboardingConfig) => void;
  onSkip?: () => void;
}

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<OnboardingConfig>({
    featureToggles: {
      agents: true,
      voiceMode: false,
      codeExecution: false,
      fileManagement: true,
      memory: true,
    },
    oauthConnections: {
      github: false,
      google: false,
      slack: false,
    },
  });

  const totalSteps = 3;

  const handleToggleFeature = (feature: keyof OnboardingConfig['featureToggles']) => {
    setConfig({
      ...config,
      featureToggles: {
        ...config.featureToggles,
        [feature]: !config.featureToggles[feature],
      },
    });
  };

  const handleOAuthConnect = (provider: keyof OnboardingConfig['oauthConnections']) => {
    // OAuth stub - simulate connection flow
    alert(`OAuth flow for ${provider} would initiate here.\n\nIn production, this would:\n1. Redirect to ${provider} OAuth consent screen\n2. Handle callback with authorization code\n3. Exchange code for access token\n4. Store encrypted credentials`);
    
    setConfig({
      ...config,
      oauthConnections: {
        ...config.oauthConnections,
        [provider]: !config.oauthConnections[provider],
      },
    });
  };

  const handleComplete = () => {
    onComplete(config);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to CubiQo!</h2>
              <p className="text-gray-300">
                Let's customize your experience. Choose which features you'd like to enable.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Feature Toggles</h3>
              
              <FeatureToggle
                label="AI Agents"
                description="Enable autonomous AI agents for task automation"
                enabled={config.featureToggles.agents}
                onChange={() => handleToggleFeature('agents')}
              />

              <FeatureToggle
                label="Voice Mode"
                description="Interact with CubiQo using voice commands"
                enabled={config.featureToggles.voiceMode}
                onChange={() => handleToggleFeature('voiceMode')}
              />

              <FeatureToggle
                label="Code Execution"
                description="Allow agents to execute code in sandboxed environment"
                enabled={config.featureToggles.codeExecution}
                onChange={() => handleToggleFeature('codeExecution')}
              />

              <FeatureToggle
                label="File Management"
                description="Enable file upload and management capabilities"
                enabled={config.featureToggles.fileManagement}
                onChange={() => handleToggleFeature('fileManagement')}
              />

              <FeatureToggle
                label="Memory & Context"
                description="Remember conversations and learn from interactions"
                enabled={config.featureToggles.memory}
                onChange={() => handleToggleFeature('memory')}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Accounts</h2>
              <p className="text-gray-300">
                Connect external services to enhance CubiQo's capabilities (optional).
              </p>
            </div>

            <div className="space-y-4">
              <OAuthConnector
                provider="GitHub"
                description="Access repositories and manage code"
                connected={config.oauthConnections.github}
                onConnect={() => handleOAuthConnect('github')}
              />

              <OAuthConnector
                provider="Google"
                description="Integrate with Gmail, Drive, and Calendar"
                connected={config.oauthConnections.google}
                onConnect={() => handleOAuthConnect('google')}
              />

              <OAuthConnector
                provider="Slack"
                description="Send notifications and manage workspace"
                connected={config.oauthConnections.slack}
                onConnect={() => handleOAuthConnect('slack')}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-gray-300 mb-4">
                Your CubiQo experience has been configured. Here's what you've enabled:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Active Features</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {Object.entries(config.featureToggles).map(([key, value]) => 
                    value && (
                      <li key={key} className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Connected Accounts</h3>
                {Object.values(config.oauthConnections).some(v => v) ? (
                  <ul className="space-y-1 text-sm text-gray-300">
                    {Object.entries(config.oauthConnections).map(([key, value]) => 
                      value && (
                        <li key={key} className="flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          {key}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No accounts connected</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 mx-1 rounded ${
                    i + 1 <= step ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-400 text-center">
              Step {step} of {totalSteps}
            </p>
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => {
                if (step === 1 && onSkip) {
                  onSkip();
                } else if (step > 1) {
                  setStep(step - 1);
                }
              }}
              className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600 transition"
            >
              {step === 1 ? 'Skip' : 'Back'}
            </button>

            <button
              onClick={() => {
                if (step < totalSteps) {
                  setStep(step + 1);
                } else {
                  handleComplete();
                }
              }}
              className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 transition"
            >
              {step === totalSteps ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

function FeatureToggle({ label, description, enabled, onChange }: FeatureToggleProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-700 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium mb-1">{label}</h4>
        <p className="text-sm text-gray-300">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

interface OAuthConnectorProps {
  provider: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
}

function OAuthConnector({ provider, description, connected, onConnect }: OAuthConnectorProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-700 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium mb-1">{provider}</h4>
        <p className="text-sm text-gray-300">{description}</p>
      </div>
      <button
        onClick={onConnect}
        className={`ml-4 px-4 py-2 rounded transition ${
          connected
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {connected ? 'Connected' : 'Connect'}
      </button>
    </div>
  );
}
