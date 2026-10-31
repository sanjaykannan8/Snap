FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY server.py ./
ENV MCP_HOST=0.0.0.0 MCP_PORT=3100
EXPOSE 3100
CMD ["uv", "run", "--locked", "--no-dev", "python", "server.py"]
