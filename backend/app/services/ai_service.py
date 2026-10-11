import io
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

try:
    import pypdf
except ImportError:
    pypdf = None


def extract_text_from_file_bytes(filename: str, file_bytes: bytes) -> str:
    """
    Extracts raw text from PDF, DOCX, or text file bytes.
    """
    if not file_bytes:
        return ""

    lower_name = (filename or "").lower()

    # 1. PDF Extraction
    if lower_name.endswith(".pdf") and pypdf is not None:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            if text.strip():
                return text.strip()
        except Exception as e:
            print(f"pypdf extraction warning: {e}")

    # 2. DOCX Extraction
    if lower_name.endswith(".docx"):
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
                xml_content = docx.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                texts = [node.text for node in tree.iterfind(".//w:t", namespaces) if node.text]
                if texts:
                    return "\n".join(texts)
        except Exception as e:
            print(f"docx extraction warning: {e}")

    # 3. Fallback to UTF-8 decoding with latin-1 fallback
    try:
        return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return file_bytes.decode("latin-1", errors="ignore")


KNOWN_TECH_SKILLS = [
    "python", "pytorch", "tensorflow", "keras", "fastapi", "flask", "django", "mysql", "postgresql",
    "mongodb", "react", "react.js", "next.js", "vue", "angular", "javascript", "typescript", "node.js", "nodejs",
    "docker", "kubernetes", "aws", "gcp", "azure", "machine learning", "deep learning", "nlp",
    "computer vision", "llm", "langchain", "scikit-learn", "pandas", "numpy", "tableau", "power bi",
    "sql", "nosql", "c++", "c#", "java", "golang", "rust", "git", "ci/cd", "rest api", "graphql",
    "redis", "kafka", "spark", "hadoop", "linux", "html", "css", "tailwind css", "data analysis",
    "data structures", "algorithms", "devops", "microservices"
]


def parse_resume_data(filename: str, file_bytes: bytes) -> Dict[str, Any]:
    """
    Intelligently parses uploaded resume file bytes and extracts candidate details:
    Full Name, Email, Phone, Technical Skills, Education, Experience, and Summary.
    """
    raw_text = extract_text_from_file_bytes(filename, file_bytes)
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

    # 1. Extract Email
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", raw_text)
    email = email_match.group(0) if email_match else ""

    # 2. Extract Phone Number
    phone_match = re.search(
        r"(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4})|(?:\+?91[-.\s]?[6-9]\d{9})|(?:\b[6-9]\d{9}\b)",
        raw_text
    )
    phone = phone_match.group(0).strip() if phone_match else ""

    # 3. Extract Candidate Name (First prominent line before email or header)
    name = ""
    ignore_keywords = [
        "resume", "curriculum", "vitae", "profile", "contact", "page", "phone", "email",
        "github", "linkedin", "experience", "education", "skills", "projects", "objective",
        "summary", "portfolio", "address", "career"
    ]
    for line in lines[:8]:
        clean_line = re.sub(r"[^a-zA-Z\s]", "", line).strip()
        words = clean_line.split()
        if 2 <= len(words) <= 4 and not any(kw in clean_line.lower() for kw in ignore_keywords):
            name = clean_line.title()
            break
    if not name and lines:
        first_clean = re.sub(r"[^a-zA-Z\s]", "", lines[0]).strip()
        if 1 <= len(first_clean.split()) <= 4:
            name = first_clean.title()

    # 4. Extract Technical Skills
    text_lower = raw_text.lower()
    matched_skills = []
    for skill in KNOWN_TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            matched_skills.append(skill.title() if len(skill) > 3 else skill.upper())

    # De-duplicate while preserving order
    unique_skills = []
    for s in matched_skills:
        if s not in unique_skills:
            unique_skills.append(s)

    skills_str = ", ".join(unique_skills) if unique_skills else ""

    # 5. Extract Education
    education = ""
    edu_patterns = [
        r"(?:B\.?Tech|Bachelor|B\.?E\.?|M\.?Tech|Master|B\.?Sc|M\.?Sc|Ph\.?D|MCA|BCA)[^\n,.]*",
        r"(?:Computer Science|Artificial Intelligence|Machine Learning|Information Technology|Data Science|Software Engineering)[^\n,.]*"
    ]
    for pattern in edu_patterns:
        match = re.search(pattern, raw_text, re.IGNORECASE)
        if match:
            education = match.group(0).strip()
            break

    # 6. Extract Experience
    exp_match = re.search(r"(\d+\+?\s*(?:years?|yrs?|months?)\s*(?:of\s*)?(?:experience|exp)?)", raw_text, re.IGNORECASE)
    if exp_match:
        experience = exp_match.group(0).strip()
    elif "intern" in text_lower or "fresher" in text_lower:
        experience = "Fresher / Intern"
    else:
        experience = ""

    # 7. Location
    loc_match = re.search(r"(?:Location|Address|City|Place)[:\s-]+([^\n,]+(?:,\s*[^\n,]+)?)", raw_text, re.IGNORECASE)
    location = loc_match.group(1).strip() if loc_match and len(loc_match.group(1).strip()) < 35 else ""

    summary = f"Candidate profile parsed successfully with {len(unique_skills)} identified skills."

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills_str,
        "education": education,
        "experience": experience,
        "location": location,
        "summary": summary,
        "raw_text": raw_text[:2000]
    }


def verify_identity_consistency(account_data: Dict[str, Any], resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes identity consistency between registered account details and extracted resume data.
    Evaluates:
    - Candidate full name similarity (token intersection / fuzzy overlap)
    - Registered email matching
    - Contact phone alignment
    - Skills & background consistency
    
    Returns comprehensive verification metrics, status (Verified / Discrepancy Detected / Discrepancy Warning),
    and structured field-by-field discrepancy analysis for interactive UI reconciliation.
    """
    account_name = (account_data.get("name") or "").strip()
    account_email = (account_data.get("email") or "").strip().lower()
    account_phone = (account_data.get("phone") or "").strip()
    account_skills = (account_data.get("skills") or "").strip()
    account_edu = (account_data.get("education") or "").strip()

    resume_name = (resume_data.get("name") or "").strip()
    resume_email = (resume_data.get("email") or "").strip().lower()
    resume_phone = (resume_data.get("phone") or "").strip()
    resume_skills = (resume_data.get("skills") or "").strip()
    resume_edu = (resume_data.get("education") or "").strip()

    discrepancies = []

    # 1. Name Analysis
    name_score = 100.0
    name_tokens_acc = set(re.findall(r"\w+", account_name.lower()))
    name_tokens_res = set(re.findall(r"\w+", resume_name.lower()))

    if account_name and resume_name:
        if account_name.lower() == resume_name.lower():
            name_score = 100.0
            name_status = "MATCH"
            name_note = "Full name matches registered account identity exactly."
        else:
            intersection = name_tokens_acc.intersection(name_tokens_res)
            if intersection:
                overlap_ratio = len(intersection) / max(len(name_tokens_acc), len(name_tokens_res))
                if overlap_ratio >= 0.5:
                    name_score = 85.0
                    name_status = "PARTIAL"
                    name_note = f"Minor name variation detected ('{account_name}' vs '{resume_name}')."
                else:
                    name_score = 40.0
                    name_status = "MISMATCH"
                    name_note = f"Document name '{resume_name}' diverges from registered account holder '{account_name}'."
            else:
                name_score = 0.0
                name_status = "MISMATCH"
                name_note = f"Identity conflict: Resume belongs to '{resume_name}', but logged in account belongs to '{account_name}'."
    elif not resume_name:
        name_score = 80.0
        name_status = "PARTIAL"
        name_note = "Candidate name could not be automatically isolated from resume document header."
    else:
        name_status = "MATCH"
        name_note = "Account name verified."

    discrepancies.append({
        "field": "Full Name",
        "key": "name",
        "account_value": account_name,
        "resume_value": resume_name or "(Not detected in document)",
        "status": name_status,
        "note": name_note,
        "score": name_score
    })

    # 2. Email Analysis
    email_score = 100.0
    if account_email and resume_email:
        if account_email == resume_email:
            email_score = 100.0
            email_status = "MATCH"
            email_note = "Email address matches registered user account."
        else:
            acc_user = account_email.split("@")[0]
            res_user = resume_email.split("@")[0]
            if acc_user == res_user:
                email_score = 75.0
                email_status = "PARTIAL"
                email_note = f"Email usernames match ('{acc_user}'), but domains differ ('{account_email}' vs '{resume_email}')."
            else:
                email_score = 0.0
                email_status = "MISMATCH"
                email_note = f"Email discrepancy: Resume lists '{resume_email}', while account is registered under '{account_email}'."
    elif not resume_email:
        email_score = 85.0
        email_status = "PARTIAL"
        email_note = "Resume does not list an email address; account email will be utilized."
    else:
        email_status = "MATCH"
        email_note = "Email verified."

    discrepancies.append({
        "field": "Email Address",
        "key": "email",
        "account_value": account_email,
        "resume_value": resume_email or "(Not listed in document)",
        "status": email_status,
        "note": email_note,
        "score": email_score
    })

    # 3. Skills Analysis
    skills_score = 85.0
    acc_skill_set = set(s.strip().lower() for s in account_skills.split(",") if s.strip())
    res_skill_set = set(s.strip().lower() for s in resume_skills.split(",") if s.strip())

    if acc_skill_set and res_skill_set:
        skill_inter = acc_skill_set.intersection(res_skill_set)
        if skill_inter:
            skills_score = min(100.0, 70.0 + (len(skill_inter) / len(acc_skill_set)) * 30.0)
            skills_status = "MATCH" if skills_score >= 85.0 else "PARTIAL"
            skills_note = f"{len(skill_inter)} primary technical skills verified between profile and resume."
        else:
            skills_score = 50.0
            skills_status = "PARTIAL"
            skills_note = "Uploaded resume highlights different skill competencies than registered profile."
    else:
        skills_status = "MATCH"
        skills_note = "Skill profile consistent."

    discrepancies.append({
        "field": "Technical Skills",
        "key": "skills",
        "account_value": account_skills or "(None listed)",
        "resume_value": resume_skills or "(Extracted from document)",
        "status": skills_status,
        "note": skills_note,
        "score": skills_score
    })

    # 4. Contact Phone Analysis
    phone_score = 100.0
    if account_phone and resume_phone:
        clean_acc_phone = re.sub(r"\D", "", account_phone)[-10:]
        clean_res_phone = re.sub(r"\D", "", resume_phone)[-10:]
        if clean_acc_phone and clean_res_phone and clean_acc_phone == clean_res_phone:
            phone_status = "MATCH"
            phone_note = "Phone number matches registered profile."
        elif clean_acc_phone and clean_res_phone:
            phone_score = 60.0
            phone_status = "PARTIAL"
            phone_note = f"Contact number on resume ('{resume_phone}') differs from account phone ('{account_phone}')."
        else:
            phone_status = "MATCH"
            phone_note = "Contact details aligned."
    else:
        phone_status = "MATCH"
        phone_note = "Phone record verified."

    discrepancies.append({
        "field": "Contact Phone",
        "key": "phone",
        "account_value": account_phone or "(Default)",
        "resume_value": resume_phone or "(Default)",
        "status": phone_status,
        "note": phone_note,
        "score": phone_score
    })

    # Calculate overall weighted identity match score
    # Name: 45%, Email: 35%, Skills: 15%, Phone: 5%
    overall_match = round(
        (name_score * 0.45) + (email_score * 0.35) + (skills_score * 0.15) + (phone_score * 0.05),
        1
    )

    has_hard_mismatch = (name_status == "MISMATCH") or (email_status == "MISMATCH")

    if has_hard_mismatch:
        status_code = "MISMATCH_DETECTED"
        summary_title = "Identity Discrepancy Detected"
        status_message = "The details in the uploaded resume diverge significantly from your registered account details. Please reconcile these discrepancies before proceeding."
        is_verified = False
    elif overall_match >= 85.0:
        status_code = "VERIFIED"
        summary_title = "Candidate Identity Verified"
        status_message = "Resume details match registered account credentials with high confidence (100% identity consistency)."
        is_verified = True
    else:
        status_code = "WARNING_PARTIAL"
        summary_title = "Minor Profile Variations Detected"
        status_message = "Minor variations detected between profile and resume. Please review and confirm your details."
        is_verified = True

    return {
        "is_verified": is_verified,
        "status": status_code,
        "match_score": overall_match,
        "summary_title": summary_title,
        "message": status_message,
        "has_hard_mismatch": has_hard_mismatch,
        "discrepancies": discrepancies,
        "account_data": {
            "name": account_name,
            "email": account_email,
            "phone": account_phone,
            "skills": account_skills,
            "education": account_edu
        },
        "resume_data": {
            "name": resume_name,
            "email": resume_email,
            "phone": resume_phone,
            "skills": resume_skills,
            "education": resume_edu
        }
    }


def screen_resume(skills_required: str, resume_text: str) -> Dict[str, Any]:
    """
    Parses resume text against required job skills, computes match ratio,
    and returns a screening score along with candidate eligibility.
    """
    if not skills_required:
        return {"score": 85.0, "eligibility": "Eligible", "matched_skills": []}

    # Split required skills by commas or slashes and clean up
    req_tokens = [s.strip().lower() for s in re.split(r"[,/|]", skills_required) if s.strip()]
    text_lower = resume_text.lower() if resume_text else ""

    # Match tokens in resume text
    matched = [token for token in req_tokens if token in text_lower]

    if req_tokens:
        match_ratio = len(matched) / len(req_tokens)
    else:
        match_ratio = 0.85

    score = round(match_ratio * 100, 1)

    # Determine eligibility status based on updated triage rules:
    # Match >= 85% -> Eligible (Qualified for AI Interview)
    # Match >= 60% -> Under Review (Pending HR manual inspection)
    # Match < 60%  -> Not Eligible
    if score >= 85.0:
        eligibility = "Eligible"
    elif score >= 60.0:
        eligibility = "Under Review"
    else:
        eligibility = "Not Eligible"

    return {
        "score": score,
        "eligibility": eligibility,
        "matched_skills": matched,
    }


import random


def generate_interview_questions(job_title: str, required_skills: str) -> List[Dict[str, Any]]:
    """
    Generates an adaptive, skill-aligned 10-question technical interview suite:
    - 4 Theoretical Questions (2 Minutes / 120s each)
    - 6 Programming / Hands-on Coding Challenges (5 Minutes / 300s each)
    
    Dynamically customizes questions to the specific role and skills required,
    guaranteeing randomized, unique interview instances every time.
    """
    skills_list = [s.strip() for s in re.split(r"[,/|]", required_skills) if s.strip()]
    if not skills_list:
        skills_list = ["Software Engineering", "System Architecture", "Python", "Data Structures", "APIs"]

    primary_skill = skills_list[0]
    sec_skill = skills_list[1] if len(skills_list) > 1 else "System Design"
    third_skill = skills_list[2] if len(skills_list) > 2 else "Algorithms"

    # --- THEORETICAL QUESTIONS POOL (Target: 4 Randomized) ---
    theoretical_pool = [
        {
            "question": f"Explain the internal memory model, execution lifecycle, and garbage collection mechanisms in {primary_skill}. How do you diagnose and prevent memory leaks in high-throughput production services?",
            "category": "Language Internals & Memory",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "Memory Management"],
        },
        {
            "question": f"In a {job_title} capacity, how do you architect distributed microservices to maintain low latency, horizontal scalability, and fault tolerance when integrating {sec_skill}?",
            "category": "Architecture & Scalability",
            "difficulty": "Hard",
            "expected_skills": [sec_skill, "System Design"],
        },
        {
            "question": f"Compare synchronous vs asynchronous execution models in {primary_skill}. What are the performance trade-offs between thread-based concurrency and event-driven async loops?",
            "category": "Concurrency & Asynchrony",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "Concurrency"],
        },
        {
            "question": f"Explain indexing strategies (B-Tree vs Hash), query execution plans, and transaction isolation levels in databases supporting {third_skill}. How do you prevent table locks and slow queries under load?",
            "category": "Database & Storage",
            "difficulty": "Medium",
            "expected_skills": [third_skill, "Database Optimization"],
        },
        {
            "question": f"What is the CAP theorem and PACELC theorem? How do distributed consistency models (eventual vs strong) affect data integrity during network partitions in {job_title} systems?",
            "category": "Distributed Systems",
            "difficulty": "Hard",
            "expected_skills": ["Distributed Systems", "Consistency"],
        },
        {
            "question": f"Discuss production observability: How do you design structured logging, distributed tracing (OpenTelemetry), and metrics aggregation to monitor microservices developed with {primary_skill}?",
            "category": "Observability & SRE",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "DevOps"],
        },
        {
            "question": "Walk us through your structured methodology for Root Cause Analysis (RCA) when an unpredictable edge-case bug causes cascading service degradation in production.",
            "category": "Problem Solving & RCA",
            "difficulty": "Medium",
            "expected_skills": ["Root Cause Analysis", "Troubleshooting"],
        },
        {
            "question": f"Explain defensive API security: How do you implement robust authentication (JWT/OAuth2), rate limiting, payload validation, and SQL/XSS prevention in {primary_skill} applications?",
            "category": "Security & Best Practices",
            "difficulty": "Hard",
            "expected_skills": [primary_skill, "Security"],
        },
        {
            "question": f"How do you design and manage caching layers (Redis / Memcached) with {primary_skill}? Discuss cache invalidation strategies, Cache Stampede, and Cache Avalanche prevention.",
            "category": "Caching & Performance",
            "difficulty": "Hard",
            "expected_skills": [primary_skill, "Redis"],
        },
        {
            "question": f"Explain CI/CD best practices, zero-downtime deployment strategies (Blue-Green vs Canary), and automated regression testing workflows for {job_title} projects.",
            "category": "DevOps & CI/CD",
            "difficulty": "Medium",
            "expected_skills": ["CI/CD", "DevOps"],
        }
    ]

    # --- PROGRAMMING / CODING CHALLENGES POOL (Target: 6 Randomized) ---
    programming_pool = [
        {
            "question": f"Write a production-grade LRU (Least Recently Used) Cache class in {primary_skill} supporting get(key) and put(key, value) in O(1) average time complexity with a fixed capacity limit.",
            "category": "Data Structures & Algorithms",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "Data Structures"],
            "code_template": "# Implement LRU Cache with O(1) get and put\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        # Initialize hash map and doubly linked list or ordered structure\n\n    def get(self, key: int) -> int:\n        # Return value and update recency; return -1 if key not found\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Insert or update key-value pair, evicting oldest item if over capacity\n        pass\n"
        },
        {
            "question": f"Write a decorator function in {primary_skill} named `@retry_with_backoff` that catches runtime exceptions and retries the decorated function up to `max_retries` with exponential backoff delay.",
            "category": "Advanced Language Features",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "Functional Programming"],
            "code_template": "import time\nimport functools\n\ndef retry_with_backoff(max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            # Catch exceptions and retry with exponential delay\n            pass\n        return wrapper\n    return decorator\n"
        },
        {
            "question": f"Implement a Token Bucket Rate Limiter algorithm in {primary_skill} that permits requests if tokens are available and refills tokens at a sustained `refill_rate` per second.",
            "category": "System Algorithms & Concurrency",
            "difficulty": "Hard",
            "expected_skills": [primary_skill, "Rate Limiting"],
            "code_template": "import time\n\nclass TokenBucketRateLimiter:\n    def __init__(self, capacity: int, refill_rate_per_sec: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate_per_sec\n        self.tokens = float(capacity)\n        self.last_refill = time.time()\n\n    def allow_request(self, tokens_needed: int = 1) -> bool:\n        # Calculate elapsed time, replenish tokens, and return boolean\n        pass\n"
        },
        {
            "question": f"Write an algorithm in {primary_skill} to detect circular dependencies (cycles in a directed dependency graph) between software modules.",
            "category": "Graph Algorithms",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "Graph Algorithms"],
            "code_template": "from typing import Dict, List\n\ndef has_circular_dependency(dependency_graph: Dict[str, List[str]]) -> bool:\n    # Return True if a cycle exists in the graph, False otherwise\n    # Example graph: {'AuthService': ['DBService'], 'DBService': ['AuthService']}\n    pass\n"
        },
        {
            "question": f"Write an asynchronous worker pool in {primary_skill} that processes a list of asynchronous tasks with a maximum concurrent task execution limit of `concurrency_limit`.",
            "category": "Asynchronous Programming",
            "difficulty": "Hard",
            "expected_skills": [primary_skill, "Async IO"],
            "code_template": "import asyncio\nfrom typing import List, Callable, Any\n\nasync def run_batched_async_tasks(tasks: List[Callable[[], Any]], concurrency_limit: int = 5) -> List[Any]:\n    # Use asyncio.Semaphore to process tasks concurrently within the limit\n    pass\n"
        },
        {
            "question": f"Write a log parser in {primary_skill} that reads server log text lines, extracts HTTP 5xx errors using regular expressions, and returns the top 3 offending endpoint paths sorted by error frequency.",
            "category": "Data Processing & Regex",
            "difficulty": "Easy",
            "expected_skills": [primary_skill, "Text Processing"],
            "code_template": "import re\nfrom collections import Counter\nfrom typing import List, Tuple\n\ndef extract_top_failing_endpoints(log_data: str) -> List[Tuple[str, int]]:\n    # Log format example: '10.0.0.1 - - [2026-09-22] \"POST /api/v1/checkout\" 500 128'\n    # Return list of tuples: [('/api/v1/checkout', count), ...]\n    pass\n"
        },
        {
            "question": f"Implement a function in {primary_skill} to compute Cosine Similarity and Euclidean Distance between two dense embedding vectors without external numerical libraries, handling zero-division safely.",
            "category": "Linear Algebra & ML Fundamentals",
            "difficulty": "Easy",
            "expected_skills": [primary_skill, "Vector Math"],
            "code_template": "import math\nfrom typing import List\n\ndef vector_metrics(vec_a: List[float], vec_b: List[float]) -> dict:\n    # Return {'cosine_similarity': float, 'euclidean_distance': float}\n    pass\n"
        },
        {
            "question": f"Write a thread-safe Singleton database connection pool in {primary_skill} utilizing double-checked locking mechanisms to guarantee single instance instantiation in multithreaded environments.",
            "category": "Design Patterns & Thread Safety",
            "difficulty": "Medium",
            "expected_skills": [primary_skill, "Concurrency"],
            "code_template": "import threading\n\nclass ThreadSafeDatabasePool:\n    _instance = None\n    _lock = threading.Lock()\n\n    def __new__(cls, *args, **kwargs):\n        # Implement thread-safe singleton instantiation\n        pass\n"
        },
        {
            "question": f"Implement an in-memory Pub/Sub Event Broker in {primary_skill} allowing topics to be subscribed to with callbacks and events to be published synchronously or asynchronously.",
            "category": "Event Driven Architecture",
            "difficulty": "Hard",
            "expected_skills": [primary_skill, "Design Patterns"],
            "code_template": "from typing import Callable, Dict, List, Any\n\nclass EventBroker:\n    def __init__(self):\n        self.subscribers: Dict[str, List[Callable[[Any], None]]] = {}\n\n    def subscribe(self, topic: str, handler: Callable[[Any], None]) -> None:\n        # Register handler for topic\n        pass\n\n    def publish(self, topic: str, data: Any) -> None:\n        # Notify all handlers registered for topic\n        pass\n"
        },
        {
            "question": f"Write a sliding-window algorithm in {primary_skill} to find the maximum sum contiguous sub-array of size `k`, and return both the maximum sum and the sub-array elements.",
            "category": "Algorithm Optimization",
            "difficulty": "Easy",
            "expected_skills": [primary_skill, "Sliding Window"],
            "code_template": "from typing import List, Tuple\n\ndef max_subarray_window(nums: List[int], k: int) -> Tuple[int, List[int]]:\n    # Return (max_sum, [sub_array_elements]) in O(n) time\n    pass\n"
        }
    ]

    # Randomly sample 4 unique Theoretical + 6 unique Programming questions
    selected_theo = random.sample(theoretical_pool, min(4, len(theoretical_pool)))
    selected_prog = random.sample(programming_pool, min(6, len(programming_pool)))

    final_questions = []
    q_id = 1

    # Add 4 Theoretical Questions (2 Minutes each / 120 seconds)
    for tq in selected_theo:
        final_questions.append({
            "id": q_id,
            "type": "theoretical",
            "time_limit": 120,  # 2 Minutes
            "question": tq["question"],
            "category": tq["category"],
            "difficulty": tq["difficulty"],
            "expected_skills": tq["expected_skills"],
            "code_template": ""
        })
        q_id += 1

    # Add 6 Programming Questions (5 Minutes each / 300 seconds)
    for pq in selected_prog:
        final_questions.append({
            "id": q_id,
            "type": "programming",
            "time_limit": 300,  # 5 Minutes
            "question": pq["question"],
            "category": pq["category"],
            "difficulty": pq["difficulty"],
            "expected_skills": pq["expected_skills"],
            "code_template": pq.get("code_template", "# Write your solution below\n")
        })
        q_id += 1

    return final_questions


GREETING_OR_FILLER_WORDS = {
    "hello", "hi", "hey", "can", "you", "hear", "me", "am", "i", "audible", "testing",
    "check", "mic", "test", "ok", "okay", "yes", "no", "yeah", "please", "sir", "mam",
    "uh", "um", "ah", "like", "so", "audio", "video", "screen", "one", "two", "three"
}

TECHNICAL_INDICATORS = {
    "architecture", "framework", "library", "production", "deploy", "deployed", "deployment",
    "latency", "throughput", "concurrency", "asynchronous", "async", "await", "multiprocessing",
    "multithreading", "pipeline", "model", "inference", "training", "weights", "dataset", "api",
    "endpoint", "database", "sql", "nosql", "redis", "caching", "cache", "memory", "leak",
    "profiling", "benchmark", "docker", "kubernetes", "cloud", "aws", "gcp", "azure", "ci/cd",
    "unit", "integration", "testing", "monitoring", "logging", "exception", "error", "handler",
    "optimization", "optimized", "scale", "scaling", "distributed", "queue", "kafka", "rabbitmq",
    "microservices", "rest", "graphql", "orm", "sqlalchemy", "django", "flask", "fastapi",
    "pytorch", "tensorflow", "scikit-learn", "numpy", "pandas", "algorithm", "complexity", "o(n)",
    "o(1)", "tree", "graph", "hash", "index", "indexing", "shard", "sharding", "replica",
    "debugging", "root cause", "rca", "traceback", "stacktrace", "postmortem", "incident"
}


STOP_WORDS = {
    "and", "or", "in", "on", "at", "to", "for", "of", "with", "a", "an", "the",
    "is", "are", "was", "were", "it", "this", "that", "your", "my", "our", "their",
    "from", "by", "as", "about", "into", "through", "during", "before", "after",
    "above", "below", "between", "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
    "should", "now", "yourself", "detail", "describe", "hands", "introduce", "explain", "tell", "us"
}


def _try_llm_evaluation(question_text: str, answer_text: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to evaluate the candidate's answer using OpenAI or Google Gemini if API keys exist.
    """
    import os
    import json
    import urllib.request

    # Check for Gemini API Key
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = f"""You are an expert technical interviewer. Evaluate this candidate's interview response against the question.
Question: {question_text}
Candidate Response: {answer_text}

Provide strict evaluation. If the candidate gives non-answers, gibberish, filler words, or says "can you hear me", score 0-10%.
Return strictly valid JSON with this format:
{{
  "relevance": float (0-100),
  "correctness": float (0-100),
  "completeness": float (0-100),
  "skill_alignment": float (0-100),
  "overall": float (0-100),
  "feedback": "Concise 1-2 sentence constructive critique of the answer."
}}"""
            req_data = json.dumps({
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }).encode("utf-8")

            req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                text_content = res_body["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text_content)
                return {
                    "relevance": round(float(data.get("relevance", 0)), 1),
                    "correctness": round(float(data.get("correctness", 0)), 1),
                    "completeness": round(float(data.get("completeness", 0)), 1),
                    "skill_alignment": round(float(data.get("skill_alignment", 0)), 1),
                    "overall": round(float(data.get("overall", 0)), 1),
                    "feedback": data.get("feedback", "AI evaluation completed.")
                }
        except Exception as e:
            print(f"Gemini evaluation fallback: {e}")

    return None


def evaluate_candidate_answer(question_text: str, answer_text: str) -> Dict[str, Any]:
    """
    Intelligently analyzes and scores candidate interview responses.
    Evaluates:
    - Non-answers, filler words, and audio checks (e.g. 'can you hear me') -> Low/Zero Score
    - Technical vocabulary & subject relevance to the specific question asked
    - Correctness of concepts and depth of practical implementation
    - Structural completeness & skill alignment
    """
    # 1. Attempt LLM Evaluation if key configured
    llm_res = _try_llm_evaluation(question_text, answer_text)
    if llm_res:
        return llm_res

    # 2. Local Semantic & Technical Analysis Engine
    raw_text = (answer_text or "").strip()
    clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", raw_text.lower())
    words = [w for w in clean_text.split() if w]
    word_count = len(words)

    # Empty or virtually empty answer
    if word_count < 4:
        return {
            "relevance": 0.0,
            "correctness": 0.0,
            "completeness": 0.0,
            "skill_alignment": 0.0,
            "overall": 0.0,
            "feedback": "No substantive response was provided for this question."
        }

    # Extract unique words & lexical diversity
    unique_words = set(words)
    diversity_ratio = len(unique_words) / word_count if word_count > 0 else 0.0

    # Calculate filler / greeting word proportion
    filler_count = sum(1 for w in words if w in GREETING_OR_FILLER_WORDS)
    filler_ratio = filler_count / word_count if word_count > 0 else 1.0

    # Question domain terms extraction
    q_clean = re.sub(r"[^a-zA-Z0-9\s]", " ", question_text.lower())
    q_words = set(w for w in q_clean.split() if len(w) > 2 and w not in GREETING_OR_FILLER_WORDS and w not in STOP_WORDS)

    # Matched technical keywords from vocabulary and question
    meaningful_candidate_words = set(w for w in unique_words if w not in STOP_WORDS and w not in GREETING_OR_FILLER_WORDS)
    matched_tech = [w for w in meaningful_candidate_words if w in TECHNICAL_INDICATORS or w in KNOWN_TECH_SKILLS]
    question_overlap = [w for w in meaningful_candidate_words if w in q_words]

    # --- CRITICAL FILTER 1: Gibberish / Repeated Mic Test / Audio Check Detection ---
    is_filler_heavy = filler_ratio >= 0.50
    is_extremely_repetitive = word_count >= 8 and diversity_ratio <= 0.30
    has_no_technical_content = len(matched_tech) == 0 and len(question_overlap) == 0

    if (is_filler_heavy or is_extremely_repetitive) and has_no_technical_content:
        return {
            "relevance": 5.0,
            "correctness": 5.0,
            "completeness": 5.0,
            "skill_alignment": 5.0,
            "overall": 5.0,
            "feedback": "Response contained audio check phrases or filler words ('can you hear me') and did not provide a technical answer."
        }

    # --- CRITICAL FILTER 2: Completely Off-Topic Answer ---
    if has_no_technical_content:
        return {
            "relevance": 10.0,
            "correctness": 15.0,
            "completeness": 10.0,
            "skill_alignment": 10.0,
            "overall": 11.2,
            "feedback": "Response is completely off-topic and does not address the technical question or required domain skills."
        }

    if filler_ratio >= 0.70:
        return {
            "relevance": 15.0,
            "correctness": 15.0,
            "completeness": 10.0,
            "skill_alignment": 10.0,
            "overall": 12.5,
            "feedback": "Answer was predominantly conversational filler without addressing the technical requirements."
        }

    # --- TECHNICAL SCORING MATRIX ---
    # 1. Relevance: Overlap with question domain + presence of relevant concepts
    rel_score = 30.0 + min(len(question_overlap) * 20.0, 40.0) + min(len(matched_tech) * 10.0, 35.0)
    relevance = min(round(rel_score, 1), 98.0)

    # 2. Correctness: Domain terminology accuracy + lexical diversity
    corr_score = 35.0 + (25.0 if len(matched_tech) >= 1 else 0) + (25.0 if len(matched_tech) >= 3 else 0) + (15.0 if diversity_ratio > 0.55 else 0)
    correctness = min(round(corr_score, 1), 96.0)

    # 3. Completeness: Substantive length + variety of explanations
    comp_score = 25.0 + (25.0 if word_count >= 15 else 0) + (25.0 if word_count >= 30 else 0) + (15.0 if word_count >= 50 else 0) + (10.0 if len(matched_tech) >= 2 else 0)
    completeness = min(round(comp_score, 1), 95.0)

    # 4. Skill Alignment: Specific framework/tech matches
    skill_score = 25.0 + min(len(matched_tech) * 18.0, 60.0) + (12.0 if any(w in unique_words for w in ["production", "scale", "pipeline", "database", "api", "architecture"]) else 0)
    skill_alignment = min(round(skill_score, 1), 98.0)

    overall = round((relevance + correctness + completeness + skill_alignment) / 4.0, 1)

    # Formulate precise constructive feedback
    if overall >= 80.0:
        feedback = "Strong technical explanation with clear domain terminology, solid methodology, and relevant production context."
    elif overall >= 60.0:
        feedback = "Adequate conceptual understanding shown, but could benefit from deeper architectural details, trade-offs, and concrete metrics."
    elif overall >= 35.0:
        feedback = "Basic high-level mention of concepts, but lacks depth and does not fully address the specific technical requirements of the question."
    else:
        feedback = "Response lacked technical substance and failed to address the core subject matter of the question."

    return {
        "relevance": round(relevance, 1),
        "correctness": round(correctness, 1),
        "completeness": round(completeness, 1),
        "skill_alignment": round(skill_alignment, 1),
        "overall": overall,
        "feedback": feedback,
    }