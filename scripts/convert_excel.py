import pandas as pd
from pathlib import Path

artifact_dir = Path(__file__).resolve().parents[1] / "artifacts" / "reference-data"
artifact_dir.mkdir(parents=True, exist_ok=True)
df = pd.read_csv(artifact_dir / "CauHoiToanHoc.csv", encoding='utf-8-sig')
df.to_excel(artifact_dir / "CauHoiToanHoc.xlsx", index=False)
