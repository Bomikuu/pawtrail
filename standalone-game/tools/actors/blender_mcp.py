"""Run an authoring script through the installed official Blender Lab MCP server."""
import argparse
import asyncio
import json
import os
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("script", type=Path)
    args = parser.parse_args()
    server = os.environ.get("PAWTRAIL_BLENDER_MCP", "/run/media/micxsz/Drive/Blender/blender_mcp/mcp/.venv/bin/blender-mcp")
    params = StdioServerParameters(command=server, env={**os.environ, "BLENDER_MCP_HOST": "127.0.0.1", "BLENDER_MCP_PORT": "9876"})
    async with stdio_client(params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            await session.initialize()
            response = await session.call_tool("execute_blender_code", {"code": args.script.read_text()})
            data = response.structuredContent or {"content": [block.model_dump() for block in response.content]}
            print(json.dumps(data, indent=2))
            if response.isError or data.get("status") == "error":
                raise SystemExit("Blender MCP authoring did not complete.")


asyncio.run(main())
