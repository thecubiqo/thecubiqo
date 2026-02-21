/**
 * Docker Container Manager
 * Manages Docker containers for workspace execution
 */

// dockerode is loaded dynamically to avoid build failures when not installed
type DockerInstance = any;

export interface ContainerConfig {
  projectId: string;
  runtime: 'nodejs' | 'python' | 'go' | 'php' | 'ruby';
  workspaceDir: string;
  resources?: {
    cpus?: number;
    memory?: number; // in MB
    storage?: number; // in MB
  };
}

export interface ContainerInfo {
  containerId: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  ipAddress?: string;
  previewUrl?: string;
  port?: number;
}

function loadDocker(): DockerInstance {
  try {
    // Dynamic import to avoid build failure when dockerode is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Docker = require('dockerode');
    return new Docker({
      socketPath: '/var/run/docker.sock',
    });
  } catch (error) {
    console.error('dockerode is not installed. Docker functionality is unavailable.');
    return null;
  }
}

export class DockerManager {
  private docker: DockerInstance;
  private containerMap: Map<string, any>;

  constructor() {
    this.docker = loadDocker();
    this.containerMap = new Map();
  }

  /**
   * Create a new container for a project workspace
   */
  async createContainer(config: ContainerConfig): Promise<ContainerInfo> {
    try {
      const { projectId, runtime, workspaceDir, resources = {} } = config;

      // Determine base image based on runtime
      const imageMap: Record<string, string> = {
        nodejs: 'node:20-alpine',
        python: 'python:3.11-slim',
        go: 'golang:1.21-alpine',
        php: 'php:8.2-cli-alpine',
        ruby: 'ruby:3.2-alpine',
      };

      const image = imageMap[runtime] || 'node:20-alpine';

      // Pull image if not exists
      await this.pullImageIfNeeded(image);

      // Create container with resource limits
      const container = await this.docker.createContainer({
        Image: image,
        name: `emergent-${projectId}-${Date.now()}`,
        Env: [
          'NODE_ENV=development',
          `PROJECT_ID=${projectId}`,
        ],
        HostConfig: {
          Memory: (resources.memory || 4096) * 1024 * 1024, // Convert MB to bytes
          NanoCpus: (resources.cpus || 2) * 1e9, // Convert CPUs to nano CPUs
          NetworkMode: 'bridge',
          Binds: [
            `${workspaceDir}:/workspace:rw`, // Mount workspace directory
          ],
          AutoRemove: false, // Keep container for inspection
        },
        WorkingDir: '/workspace',
        Cmd: ['/bin/sh'], // Keep container alive
        Tty: true,
        OpenStdin: true,
        Labels: {
          'emergent.project': projectId,
          'emergent.runtime': runtime,
        },
      });

      this.containerMap.set(projectId, container);

      return {
        containerId: container.id,
        status: 'creating',
      };
    } catch (error) {
      console.error('Failed to create container:', error);
      return {
        containerId: '',
        status: 'error',
      };
    }
  }

  /**
   * Start a container and get network info
   */
  async startContainer(containerId: string): Promise<ContainerInfo> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();

      // Get container info including IP address
      const containerInfo = await container.inspect();
      const ipAddress = containerInfo.NetworkSettings.IPAddress;

      // Assign a random port for preview (in production, use port mapping)
      const port = 3000 + Math.floor(Math.random() * 1000);

      // Generate preview URL (in production, use Nginx reverse proxy)
      const previewUrl = `http://${ipAddress}:${port}`;

      return {
        containerId,
        status: 'running',
        ipAddress,
        previewUrl,
        port,
      };
    } catch (error) {
      console.error('Failed to start container:', error);
      return {
        containerId,
        status: 'error',
      };
    }
  }

  /**
   * Stop a container gracefully
   */
  async stopContainer(containerId: string): Promise<boolean> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 10 }); // 10 second grace period
      return true;
    } catch (error) {
      console.error('Failed to stop container:', error);
      return false;
    }
  }

  /**
   * Execute a command in a running container
   */
  async execCommand(
    containerId: string,
    command: string
  ): Promise<{ output: string; exitCode: number }> {
    try {
      const container = this.docker.getContainer(containerId);

      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ Detach: false });

      let output = '';
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });

      // Wait for command to complete
      await new Promise((resolve) => {
        stream.on('end', resolve);
      });

      const inspectData = await exec.inspect();

      return {
        output,
        exitCode: inspectData.ExitCode || 0,
      };
    } catch (error) {
      console.error('Failed to execute command:', error);
      return {
        output: `Error: ${error}`,
        exitCode: 1,
      };
    }
  }

  /**
   * Get container logs (streaming)
   */
  async getContainerLogs(
    containerId: string,
    tail: number = 100
  ): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);

      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });

      return logs.toString();
    } catch (error) {
      console.error('Failed to get container logs:', error);
      return `Error fetching logs: ${error}`;
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(containerId: string): Promise<boolean> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force: true });
      return true;
    } catch (error) {
      console.error('Failed to remove container:', error);
      return false;
    }
  }

  /**
   * List all containers for a project
   */
  async listContainers(projectId?: string): Promise<ContainerInfo[]> {
    try {
      const filters: any = {
        label: ['emergent.project'],
      };

      if (projectId) {
        filters.label.push(`emergent.project=${projectId}`);
      }

      const containers = await this.docker.listContainers({
        all: true,
        filters,
      });

      return containers.map((container: any) => ({
        containerId: container.Id,
        status: container.State as any,
        ipAddress: container.NetworkSettings?.Networks?.bridge?.IPAddress,
      }));
    } catch (error) {
      console.error('Failed to list containers:', error);
      return [];
    }
  }

  /**
   * Pull Docker image if not already present
   */
  private async pullImageIfNeeded(imageName: string): Promise<void> {
    try {
      // Check if image exists
      await this.docker.getImage(imageName).inspect();
    } catch (error) {
      // Image doesn't exist, pull it
      console.log(`Pulling Docker image: ${imageName}`);

      const stream = await this.docker.pull(imageName);

      // Wait for pull to complete
      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err: any, res: any) => {
          if (err) reject(err);
          else resolve(res);
        });
      });

      console.log(`Successfully pulled image: ${imageName}`);
    }
  }

  /**
   * Check if Docker daemon is accessible
   */
  async ping(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      console.error('Docker daemon not accessible:', error);
      return false;
    }
  }

  /**
   * Get Docker info
   */
  async getInfo(): Promise<any> {
    try {
      return await this.docker.info();
    } catch (error) {
      console.error('Failed to get Docker info:', error);
      return null;
    }
  }
}

// Export singleton instance
let dockerManagerInstance: DockerManager | null = null;

export function getDockerManager(): DockerManager {
  if (!dockerManagerInstance) {
    dockerManagerInstance = new DockerManager();
  }
  return dockerManagerInstance;
}
