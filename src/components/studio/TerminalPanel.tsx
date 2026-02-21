import { useEffect, useRef } from 'react';

export default function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !terminalRef.current || xtermRef.current) return;

    let disposed = false;

    // Dynamically import xterm to avoid build failure when not installed
    Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
    ]).then(([{ Terminal }, { FitAddon }]) => {
      if (disposed || !terminalRef.current) return;

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

      // Open terminal
      terminal.open(terminalRef.current!);
      fitAddon.fit();

      // Write welcome message
      terminal.writeln('Welcome to CubiQo Studio Terminal!');
      terminal.writeln('');
      terminal.writeln('$ _');

      // Simulate interactive terminal
      let currentLine = '';
      terminal.onData((data: string) => {
        if (data === '\r') { // Enter key
          terminal.write('\r\n');
          if (currentLine.trim()) {
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

      // Handle resize
      const handleResize = () => {
        fitAddon.fit();
      };
      window.addEventListener('resize', handleResize);

      cleanupRef.current = () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    }).catch((err) => {
      console.warn('Terminal dependencies not available:', err);
      if (terminalRef.current) {
        terminalRef.current.innerHTML = '<p class="text-gray-400 text-sm p-4">Terminal not available</p>';
      }
    });

    // Cleanup
    return () => {
      disposed = true;
      cleanupRef.current?.();
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
