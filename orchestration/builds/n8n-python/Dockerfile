# n8n with Python Support
# Includes Python 3 for Code/Python nodes and AI integrations
FROM n8nio/n8n:latest

USER root

# Install Python 3 and common packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    musl-dev \
    libffi-dev \
    && ln -sf python3 /usr/bin/python

# Install common Python packages for AI/automation
RUN pip3 install --no-cache-dir --break-system-packages \
    requests \
    pandas \
    numpy \
    python-dotenv \
    openai \
    httpx \
    aiohttp \
    beautifulsoup4 \
    lxml

USER node
