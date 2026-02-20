import { useEffect, useRef } from 'react';
// XTerm is dynamically imported to avoid build issues

export default function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !terminalRef.current || xtermRef.current) return;

    const initTerminal = async () => {
      try {
        // Dynamically import xterm modules
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');
        await import('@xterm/xterm/css/xterm.css');

        // Create terminal instance
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: '#1f2937',
            foreground: '#e5e7eb',
            cursor: '#10b981',
            selectionBackground: '#374151',
          },
          rows: 15,
        });

        // Create fit addon
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        // Open terminal if ref exists
        if (terminalRef.current) {
          terminal.open(terminalRef.current);
          fitAddon.fit();
        }

        // Write welcome message
        terminal.writeln('Welcome to CubiQo Studio Terminal!');
        terminal.writeln('');
        terminal.writeln('$ _');

        // Simulate interactive terminal
        let currentLine = '';
        terminal.onData((data) => {
          if (data === '\r') { // Enter key
            terminal.write('\r\n');
            if (currentLine.trim()) {
              // Simulate command execution
              terminal.writeln(`Command "${currentLine}" received (integration coming soon)`);
            }
            terminal.write('$ ');
            currentLine = '';
          } else if (data === '\u007F') { // Backspace
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              terminal.write('\b \b');
            }
          } else {
            currentLine += data;
            terminal.write(data);
          }
        });

        // Save refs
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;

      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        if (terminalRef.current) {
          terminalRef.current.innerHTML = '<div class="p-4 text-gray-500">Terminal initialization failed. Missing dependencies.</div>';
        }
      }
    };

    initTerminal();

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">💻 Terminal</h3>
        <div className="flex gap-2">
          <button className="text-xs text-gray-400 hover:text-gray-200">
            Clear
          </button>
          <button className="text-xs text-gray-400 hover:text-gray-200">
            Split
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
}
