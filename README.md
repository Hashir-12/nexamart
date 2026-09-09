# NexaMart – AI Commerce Agent (Phase 1)

This is the foundation of an AI‑powered e‑commerce platform. It includes a polished marketplace frontend and a minimal backend ready for future AI/RAG integration.

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env
# (Edit .env if needed)
uvicorn app.main:app --reload --port 8000