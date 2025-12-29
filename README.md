# FastAPI QR Code Generator

A production-ready, modular QR Code Generator built with FastAPI and Python. Includes a premium, glassmorphism-styled UI.

## Features

- **FastAPI**: High performance, easy to learn, fast to code, ready for production.
- **Frontend UI**: Built-in glassmorphism-styled Single Page Application (SPA).
- **Modular Design**: Structured for scalability (core, services, schemas, api).
- **QR Code Generation**: Generates QR codes from URL or text with customizable options.
- **Logging**: Modular logging configuration.
- **Testing**: Comprehensive unit tests with `pytest`.
- **Dependency Management**: Managed with `uv`.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd fastapi-qr-code
    ```

2.  **Install dependencies using `uv`:**
    ```bash
    uv sync
    ```

## Usage

### Running the Application

Start the development server:

```bash
uv run uvicorn src.app.main:app --reload
```

- **User Interface**: Open `http://localhost:8000` to use the web-based QR code generator.
- **API**: The API is available at `http://localhost:8000/api/v1`.

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Generate a QR Code (API)

**Endpoint:** `POST /qr/generate`

**Request Body:**

```json
{
  "url": "https://www.example.com",
  "box_size": 10,
  "border": 4,
  "fill_color": "black",
  "back_color": "white"
}
```

**Response:**
- Returns a PNG image of the QR code.

## Testing

Run the test suite with `pytest`:

```bash
uv run pytest
```

## Project Structure

```
fastapi-qr-code/
├── pyproject.toml      # Project dependencies and config
├── README.md           # Project documentation
├── src/
│   └── app/
│       ├── api/        # API endpoints
│       ├── core/       # Core configuration (config, logging)
│       ├── schemas/    # Pydantic models
│       ├── services/   # Business logic
│       ├── static/     # Static files (Frontend UI)
│       │   └── index.html
│       └── main.py     # App entry point
└── tests/              # Unit tests
```
