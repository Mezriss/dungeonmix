# E2E Testing with Playwright in Podman

This project uses Playwright for end-to-end testing, running in a Podman container to avoid installing browser dependencies on your system.

## Prerequisites

- Podman installed on your system
- podman-compose installed (`pip install podman-compose` or your package manager)
- X11 server running (for headed/UI modes - typically already running on Linux desktops)

## Running Tests

### Basic test run (headless)

```bash
pnpm run test:e2e
```

### Run with UI mode

```bash
pnpm run test:e2e:ui
```

Then open provided link in your browser to see the Playwright UI.

### Run in headed mode (see browser)

```bash
pnpm run test:e2e:headed
```

### Debug mode

```bash
pnpm run test:e2e:debug
```

## Manual Container Commands

### Build the container

```bash
podman-compose build playwright
```

### Run tests manually

```bash
podman-compose run --rm playwright pnpm exec playwright test
```

### Run specific test file

```bash
podman-compose run --rm playwright pnpm exec playwright test e2e/example.spec.ts
```

### Run tests in a specific browser

```bash
podman-compose run --rm playwright pnpm exec playwright test --project=chromium
```

### Generate tests interactively

```bash
podman-compose run --rm playwright pnpm exec playwright codegen http://localhost:5173
```

## Running Dev Server in Container

If you need to run the dev server in a container for testing:

```bash
podman-compose up dev
```

This will start the dev server on http://localhost:5173

## Viewing Test Reports

After running tests, view the HTML report:

```bash
podman-compose run --rm playwright pnpm exec playwright show-report
```

## Tips

- The container mounts your project directory, so changes to test files are immediately available
- Test results and reports are saved to your local filesystem
- The container uses the official Playwright image with all browsers pre-installed
- The `:Z` flag in volume mounts handles SELinux contexts automatically

## Troubleshooting

### Permission issues

If you encounter permission issues, ensure your user can run Podman without sudo:

```bash
podman system migrate
```

### Container build fails

Try cleaning up and rebuilding:

```bash
podman-compose down
podman-compose build --no-cache playwright
```

### Tests can't connect to dev server

Make sure your dev server is accessible. If running tests against a local dev server outside the container, use `host.containers.internal` instead of `localhost` in your test configuration.

### X11 errors in headed/UI mode

If you get "Target page, context or browser has been closed" or X11 errors:

1. Ensure X11 is running (check `echo $DISPLAY`)
2. The npm scripts automatically run `xhost +local:` to grant access
3. If issues persist, manually run:
   ```bash
   xhost +local:
   podman-compose run --rm playwright pnpm exec playwright test --headed
   xhost -local:
   ```

### SELinux issues with X11

If you're on a system with SELinux and get permission denied errors:

```bash
# Temporarily allow container access to X11 socket
sudo chcon -t container_file_t /tmp/.X11-unix/X0
```

Or use the container in permissive mode (already configured in compose.yaml with `label=disable`).
