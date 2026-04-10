from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.api.dependencies.database import SessionLocal
from backend.api.models.dataset import DatasetTemplate, DatasetTransaction, DatasetBudget


def seed_demo_datasets():
    db: Session = SessionLocal()

    student_template = DatasetTemplate(name="College Student", description="College Student Demo")
    recent_grad_tpl = DatasetTemplate(name="Recent Graduate", description="Recent Graduate Demo")

    try:
        db.add_all([student_template, recent_grad_tpl])
        db.commit()
        db.refresh(student_template)
        db.refresh(recent_grad_tpl)
    except IntegrityError:
        db.rollback()
        print("Demo datasets already exist! Skipping seed.")
        db.close()
        return

    student_txs = [
        # Monthly Subscriptions
        DatasetTransaction(template_id=student_template.id, store_name="Netflix", category="Entertainment", cost=15.49,
                           day_offset=-60),
        DatasetTransaction(template_id=student_template.id, store_name="Netflix", category="Entertainment", cost=15.49,
                           day_offset=-30),
        DatasetTransaction(template_id=student_template.id, store_name="Spotify", category="Entertainment", cost=5.99,
                           day_offset=-45),
        DatasetTransaction(template_id=student_template.id, store_name="Spotify", category="Entertainment", cost=5.99,
                           day_offset=-15),
        # Duplicate Subscription
        DatasetTransaction(template_id=student_template.id, store_name="Youtube_Premium",
                           category="Entertainment", cost=14.99, day_offset=-5),
        DatasetTransaction(template_id=student_template.id, store_name="Youtube_Premium",
                           category="Entertainment", cost=14.99, day_offset=-3),
        # Anomaly
        DatasetTransaction(template_id=student_template.id, store_name="Target", category="Groceries", cost=35.00,
                           day_offset=-50),
        DatasetTransaction(template_id=student_template.id, store_name="Target", category="Groceries", cost=32.50,
                           day_offset=-40),
        DatasetTransaction(template_id=student_template.id, store_name="Target", category="Groceries", cost=38.00,
                           day_offset=-30),
        DatasetTransaction(template_id=student_template.id, store_name="Target", category="Groceries", cost=36.00,
                           day_offset=-20),
        DatasetTransaction(template_id=student_template.id, store_name="Target", category="Groceries", cost=250.00,
                           day_offset=-5),

        DatasetTransaction(template_id=student_template.id, store_name="Chipotle", category="Food", cost=12.50,
                           day_offset=-10),
        DatasetTransaction(template_id=student_template.id, store_name="Starbucks", category="Food", cost=5.50,
                           day_offset=-2),
    ]

    recent_grad_txs = [
        # Monthly Subscriptions
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="Student Loans", category="Education",
                           cost=250.00, day_offset=-60),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="Student Loans", category="Education",
                           cost=250.00, day_offset=-30),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="Student Loans", category="Education",
                           cost=250.00, day_offset=0),
        # Duplicate Subscriptions
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="LinkedIn Premium", category="Software",
                           cost=29.99, day_offset=-5),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="LinkedIn Premium", category="Software",
                           cost=29.99, day_offset=-3),
        # Anomaly
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="IKEA", category="Furniture", cost=35.00,
                           day_offset=-45),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="IKEA", category="Furniture", cost=40.00,
                           day_offset=-35),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="IKEA", category="Furniture", cost=25.00,
                           day_offset=-25),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="IKEA", category="Furniture", cost=30.00,
                           day_offset=-15),
        DatasetTransaction(template_id=recent_grad_tpl.id, store_name="IKEA", category="Furniture", cost=650.00,
                           day_offset=-2),

    ]

    demo_budgets = [
        DatasetBudget(template_id=student_template.id, amount=800, period="Monthly"),
        DatasetBudget(template_id=recent_grad_tpl.id, amount=3000, period="Monthly"),
    ]

    db.add_all(student_txs)
    db.add_all(recent_grad_txs)
    db.add_all(demo_budgets)
    db.commit()

    print("Demo datasets setup complete")
    db.close()

if __name__ == "__main__":
    seed_demo_datasets()