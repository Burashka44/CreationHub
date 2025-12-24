# DOCKER_MODEL.md
CreationHub — Docker Model

## Networks
Docker uses CGNAT ranges to avoid conflicts.

backend:
- subnet: 100.64.10.0/24
- internal: true

egress:
- subnet: 100.64.20.0/24
- outbound internet only

## Communication Rules
- Containers communicate by service name only
- No IP hardcoding
- No localhost usage inside containers

## Service Isolation
- One PostgreSQL container
- Separate DB and user per service
- Separate volume per service
- No shared volumes

## Access Policy
- Docker Web UIs: LAN only
- No direct WAN exposure
- WAN access only via NPM or VPN
