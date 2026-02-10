import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from .models import model_loader
from .routers import index as indexRoute
from .dependencies.config import conf
app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_loader.index()
indexRoute.load_routes(app)

if __name__ == "__main__":
    uvicorn.run(app, host=conf.app_host, port=8000)