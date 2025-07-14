FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Create directory for database
RUN mkdir -p /data

# Set environment variables
ENV DATABASE_PATH=/data/todo.db

# Make the entrypoint executable
RUN chmod +x src/index.ts

# Run the server
CMD ["bun", "run", "src/index.ts"]