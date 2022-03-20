from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import ke

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("index.html")


@app.get("/kleenexp/")
async def kleenexp(kleenexp: str):
    try:
        return {"regex": ke.re(kleenexp, syntax="javascript")}
    except ke.KleenexpError as e:
        return {"error": str(e)}
