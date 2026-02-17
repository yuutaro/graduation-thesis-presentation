# Payment Platform 2 - Agent Configuration Guide

This directory contains agent-related configurations and scripts.

## 📂 Project Structure

- `agent/`: Agent-related configurations/scripts

## 🤖 Mandatory Coding Rules

The following rules must be strictly followed when generating code or performing tasks:

1.  **AI Model:** ALWAYS use `gemini-3-flash-preview`.
2.  **Database Access:**
    - DO NOT use Prisma or any other ORM for the Agent DB.
    - ALWAYS use `better-sqlite3` combined with `sqlite-vec` for database operations.
    - Vectors are handled as raw BLOBs (Float32Array buffers).
3.  **Troubleshooting:** If you encounter errors or get stuck, YOU MUST use the **context7** tool to consult the latest documentation and resolve the issue.

## 📝 General Guidelines for Agents

1. **Context Awareness:**
   - You are working in the `agent` directory.
   - Read related files before modifying code to match existing patterns.

2. **File Operations:**
   - Use absolute paths.
   - **Do not** create new files unless necessary; prefer modifying existing ones.

3. **Language:**
   - **Code:** English naming (variables, functions, classes).
   - **Comments/Docs:** Japanese (日本語).
