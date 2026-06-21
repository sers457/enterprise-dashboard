import uuid
import random
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.user_session import UserSession
from app.models.user_permission import UserPermission
from app.models.audit_log import AuditLog
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.invoice import Invoice
from app.models.transaction import Transaction
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder
from app.models.ai_conversation import AIConversation
from app.models.ai_workflow import AIWorkflow
from app.models.notification import Notification


async def seed_superadmin(db: AsyncSession):
    result = await db.execute(select(User).where(User.email == "admin@enterprise.com"))
    if result.scalar_one_or_none():
        return
    user = User(
        id=uuid.uuid4(),
        email="admin@enterprise.com",
        username="superadmin",
        hashed_password=get_password_hash("Admin@123456"),
        full_name="System Administrator",
        role="superadmin",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.commit()
    print("Superadmin created: admin@enterprise.com / Admin@123456")


async def seed_demo_users(db: AsyncSession):
    roles = ["user", "admin", "manager"]
    first_names = ["John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa", "William", "Emma",
                   "James", "Olivia", "Daniel", "Sophia", "Matthew", "Isabella", "Andrew", "Mia", "Christopher", "Charlotte"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

    result = await db.execute(select(func.count(User.id)))
    count = result.scalar()
    if count > 1:
        return

    for i in range(50):
        first = random.choice(first_names)
        last = random.choice(last_names)
        fn = f"{first} {last}"
        username = f"{first.lower()}.{last.lower()}{i}"
        email = f"{username}@enterprise.com"
        user = User(
            id=uuid.uuid4(),
            email=email,
            username=username,
            hashed_password=get_password_hash("Demo@123456"),
            full_name=fn,
            role=random.choice(roles),
            is_active=random.random() > 0.1,
            is_verified=random.random() > 0.2,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 365)),
        )
        db.add(user)
    await db.commit()
    print("50 demo users created")


async def seed_customers(db: AsyncSession):
    result = await db.execute(select(func.count(Customer.id)))
    if result.scalar() > 0:
        return

    companies = ["TechCorp", "DataFlow", "CloudNine", "Innovate Inc", "GlobalSys", "PrimeStack", "NexGen", "BrightPath",
                 "StarLogic", "CoreAxis", "FusionWorks", "PinnacleSoft", "VertexSolutions", "ApexDigital", "SummitTech"]
    statuses = ["active", "active", "active", "inactive", "lead", "churned"]
    sources = ["website", "referral", "linkedin", "google_ads", "facebook", "conference", "cold_call", "partner"]

    for i in range(100):
        company = random.choice(companies)
        customer = Customer(
            id=uuid.uuid4(),
            name=f"Contact {i+1}",
            email=f"contact{i+1}@{company.lower().replace(' ', '')}.com",
            phone=f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
            company=company,
            status=random.choice(statuses),
            source=random.choice(sources),
            revenue=round(random.uniform(1000, 100000), 2),
            lifetime_value=round(random.uniform(5000, 500000), 2),
            last_contact=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 90)),
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 730)),
        )
        db.add(customer)
    await db.commit()
    print("100 customers created")


async def seed_leads(db: AsyncSession):
    result = await db.execute(select(func.count(Lead.id)))
    if result.scalar() > 0:
        return

    statuses = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]
    sources = ["website", "referral", "linkedin", "google_ads", "facebook", "conference", "cold_call", "partner"]

    cust_result = await db.execute(select(Customer.id))
    customer_ids = cust_result.scalars().all()

    for i in range(50):
        lead = Lead(
            id=uuid.uuid4(),
            customer_id=random.choice(customer_ids),
            status=random.choice(statuses),
            source=random.choice(sources),
            score=random.randint(0, 100),
            expected_revenue=round(random.uniform(5000, 200000), 2),
            probability=random.randint(10, 100),
            notes=f"Lead {i+1} - interested in enterprise plan",
            next_followup=datetime.now(timezone.utc) + timedelta(days=random.randint(1, 30)),
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 180)),
        )
        db.add(lead)
    await db.commit()
    print("50 leads created")


async def seed_transactions(db: AsyncSession):
    result = await db.execute(select(func.count(Transaction.id)))
    if result.scalar() > 0:
        return

    types = ["revenue", "expense", "revenue", "revenue", "expense"]
    categories_revenue = ["product_sales", "services", "subscription", "consulting", "licensing"]
    categories_expense = ["salaries", "rent", "utilities", "software", "marketing", "travel", "equipment"]

    cust_result = await db.execute(select(Customer.id))
    customer_ids = cust_result.scalars().all()

    user_result = await db.execute(select(User.id))
    user_ids = user_result.scalars().all()

    for i in range(200):
        is_revenue = random.random() > 0.35
        txn_type = random.choice(types)
        category = random.choice(categories_revenue) if txn_type in ("revenue",) else random.choice(categories_expense)
        days_ago = random.randint(0, 365)
        txn = Transaction(
            id=uuid.uuid4(),
            type=txn_type,
            amount=round(random.uniform(100, 50000), 2),
            category=category,
            description=f"{txn_type.title()} transaction #{i+1}",
            reference=f"REF-{uuid.uuid4().hex[:8].upper()}",
            customer_id=random.choice(customer_ids) if is_revenue else None,
            created_by=random.choice(user_ids),
            date=datetime.now(timezone.utc) - timedelta(days=days_ago),
        )
        db.add(txn)
    await db.commit()
    print("200 transactions created")


async def seed_invoices(db: AsyncSession):
    result = await db.execute(select(func.count(Invoice.id)))
    if result.scalar() > 0:
        return

    statuses = ["draft", "sent", "paid", "paid", "paid", "overdue"]
    cust_result = await db.execute(select(Customer.id))
    customer_ids = cust_result.scalars().all()

    user_result = await db.execute(select(User.id))
    user_ids = user_result.scalars().all()

    for i in range(50):
        amount = round(random.uniform(1000, 50000), 2)
        tax = round(amount * 0.1, 2)
        created = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 180))
        inv = Invoice(
            id=uuid.uuid4(),
            invoice_number=f"INV-{10000+i+1:05d}",
            customer_id=random.choice(customer_ids),
            amount=amount,
            tax=tax,
            total=amount + tax,
            status=random.choice(statuses),
            due_date=created + timedelta(days=30),
            paid_at=created + timedelta(days=random.randint(1, 15)) if random.random() > 0.4 else None,
            items=[{"description": f"Service {i+1}", "quantity": 1, "unit_price": amount, "amount": amount}],
            created_by=random.choice(user_ids),
            created_at=created,
        )
        db.add(inv)
    await db.commit()
    print("50 invoices created")


async def seed_products(db: AsyncSession):
    result = await db.execute(select(func.count(Product.id)))
    if result.scalar() > 0:
        return

    products_data = [
        ("Laptop Pro 15", "LAP-001", "Electronics", 1999.99, 1500.00, 50, 10),
        ("Wireless Mouse", "ACC-001", "Accessories", 49.99, 25.00, 500, 50),
        ("Mechanical Keyboard", "ACC-002", "Accessories", 149.99, 80.00, 200, 30),
        ("27\" 4K Monitor", "MON-001", "Electronics", 699.99, 450.00, 75, 15),
        ("USB-C Hub", "ACC-003", "Accessories", 79.99, 40.00, 300, 40),
        ("Cloud Storage License", "SAAS-001", "Software", 29.99, 5.00, 1000, 100),
        ("Analytics Dashboard", "SAAS-002", "Software", 99.99, 20.00, 500, 50),
        ("Web Hosting Basic", "HST-001", "Services", 9.99, 3.00, 2000, 200),
        ("Web Hosting Pro", "HST-002", "Services", 29.99, 8.00, 500, 50),
        ("SSL Certificate", "SEC-001", "Security", 99.99, 30.00, 300, 30),
        ("VPN Service", "SEC-002", "Security", 14.99, 5.00, 800, 80),
        ("Backup Solution", "INF-001", "Infrastructure", 49.99, 15.00, 400, 40),
        ("Load Balancer", "INF-002", "Infrastructure", 199.99, 80.00, 100, 15),
        ("Database Server", "INF-003", "Infrastructure", 499.99, 200.00, 50, 10),
        ("API Gateway", "SAAS-003", "Software", 149.99, 40.00, 200, 25),
        ("Email Service", "SAAS-004", "Software", 19.99, 5.00, 1500, 150),
        ("Smart Speaker", "IOT-001", "IoT", 129.99, 70.00, 150, 20),
        ("Security Camera", "IOT-002", "IoT", 199.99, 100.00, 100, 15),
        ("Smart Thermostat", "IOT-003", "IoT", 249.99, 130.00, 80, 12),
        ("Monitor Arm", "ACC-004", "Accessories", 89.99, 40.00, 180, 25),
        ("Desk Lamp LED", "ACC-005", "Accessories", 59.99, 25.00, 250, 35),
        ("Noise Cancelling Headphones", "AUD-001", "Audio", 349.99, 200.00, 120, 15),
        ("Webcam 4K", "ACC-006", "Accessories", 199.99, 110.00, 90, 15),
        ("Microphone USB", "AUD-002", "Audio", 129.99, 60.00, 75, 10),
        ("Graphics Tablet", "ACC-007", "Accessories", 399.99, 250.00, 40, 8),
        ("External SSD 1TB", "STO-001", "Storage", 149.99, 80.00, 200, 25),
        ("NAS Server", "STO-002", "Storage", 599.99, 350.00, 30, 5),
        ("Network Switch 24-port", "NET-001", "Networking", 299.99, 150.00, 60, 10),
        ("WiFi Router Pro", "NET-002", "Networking", 249.99, 120.00, 100, 15),
        ("Firewall Appliance", "SEC-003", "Security", 899.99, 500.00, 25, 5),
    ]

    for name, sku, category, price, cost, stock, min_stock in products_data:
        product = Product(
            id=uuid.uuid4(),
            name=name,
            sku=sku,
            description=f"High-quality {name.lower()} - enterprise grade",
            price=price,
            cost=cost,
            stock_quantity=stock,
            min_stock_level=min_stock,
            category=category,
            is_active=True,
        )
        db.add(product)
    await db.commit()
    print("30 products created")


async def seed_suppliers(db: AsyncSession):
    result = await db.execute(select(func.count(Supplier.id)))
    if result.scalar() > 0:
        return

    suppliers = [
        ("GlobalTech Supply", "Robert Chen", "robert@globaltech.com", "+1-555-101-1000", "123 Tech Blvd, San Francisco, CA"),
        ("Pacific Components", "Maria Santos", "maria@pacificcomp.com", "+1-555-102-2000", "456 Harbor Dr, Los Angeles, CA"),
        ("Northern Distributors", "James Wilson", "james@northerndist.com", "+1-555-103-3000", "789 Industrial Pkwy, Seattle, WA"),
        ("East Coast Electronics", "Sarah Johnson", "sarah@eastcoastelec.com", "+1-555-104-4000", "321 Commerce St, New York, NY"),
        ("Central Supply Co", "Mike Brown", "mike@centralsupply.com", "+1-555-105-5000", "654 Market Sq, Chicago, IL"),
        ("Transpacific Imports", "Lisa Wang", "lisa@transpacific.com", "+1-555-106-6000", "987 Trade Center, Houston, TX"),
        ("Quantum Parts", "David Kim", "david@quantumparts.com", "+1-555-107-7000", "111 Innovation Dr, Austin, TX"),
        ("Reliable Source Inc", "Emily Davis", "emily@reliablesource.com", "+1-555-108-8000", "222 Factory Rd, Denver, CO"),
        ("Phoenix Hardware", "Chris Martinez", "chris@phoenixhw.com", "+1-555-109-9000", "333 Tech Park, Phoenix, AZ"),
        ("Valley Components", "Anna Taylor", "anna@valleycomp.com", "+1-555-110-0000", "444 Silicon Ave, San Jose, CA"),
    ]

    for name, contact, email, phone, address in suppliers:
        supplier = Supplier(
            id=uuid.uuid4(),
            name=name,
            contact_person=contact,
            email=email,
            phone=phone,
            address=address,
            status="active",
        )
        db.add(supplier)
    await db.commit()
    print("10 suppliers created")


async def seed_analytics_data(db: AsyncSession):
    pass


async def run_all_seeders():
    async with async_session() as db:
        await seed_superadmin(db)
        await seed_demo_users(db)
        await seed_customers(db)
        await seed_leads(db)
        await seed_products(db)
        await seed_suppliers(db)
        await seed_transactions(db)
        await seed_invoices(db)
        await seed_analytics_data(db)
    print("All seed data created successfully!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_seeders())
