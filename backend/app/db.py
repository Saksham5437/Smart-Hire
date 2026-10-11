from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 127.0.0.1:3307 / database: smarthire
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:Sakre5437@localhost:3306/smarthire"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()