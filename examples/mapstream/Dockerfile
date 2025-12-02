FROM rust:1.91-trixie as builder

# Download and install nvm:
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# in lieu of restarting the shell
RUN \. "$HOME/.nvm/nvm.sh" && nvm install 24.11.1
# Download and install Node.js:

ENV PNPM_HOME=/opt/pnpm
ENV PATH=/bin/versions/node/v24.11.1/bin:$PNPM_HOME:$PATH
ENV SHELL=/bin/bash

RUN corepack enable pnpm

RUN pnpm setup && pnpm add -g @napi-rs/cli


# Set working directory
WORKDIR /app

COPY . .

RUN pnpm run build
RUN cd examples/mapstream/ && pnpm tsc

FROM node:24-trixie-slim

WORKDIR /app

COPY --from=builder /app/binding.js /app/binding.js
COPY --from=builder /app/binding.d.ts /app/binding.d.ts
COPY --from=builder /app/index.js /app/index.js
COPY --from=builder /app/index.d.ts /app/index.d.ts
COPY --from=builder /app/*.node /app/
COPY --from=builder /app/examples /app/examples

RUN addgroup --system appuser && adduser --system --ingroup appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Set default command (can be changed as needed)
CMD ["node", "examples/mapstream/mapstream.js"]

