# Contoso Claims - Multi-Agent Insurance Claims Platform

An **Agentic AI Claims Demo** powered by advanced multi-agent systems leveraging **agent-framework** and **Azure OpenAI (GPT-4o)**, designed to streamline and enhance the end-to-end insurance claims process. This proof-of-concept showcases a cutting-edge architecture in which specialized AI agents collaboratively assess claims, delivering instant, transparent, and explainable recommendations directly to claims processors. By augmenting human decision-making, the solution significantly accelerates claim handling—reducing processing time from hours to minutes—while enhancing consistency, transparency, and customer satisfaction.

## 🎯 What This Demo Showcases

### Multi-Agent Architecture
Unlike traditional single-model AI systems, Contoso Claims employs a **collaborative multi-agent approach** where specialized AI agents work together:

- **🔍 Claim Assessor Agent** - Analyzes damage photos, evaluates repair costs, and validates claim consistency
- **📋 Policy Checker Agent** - Verifies coverage terms, searches policy documents, and determines claim eligibility  
- **⚠️ Risk Analyst Agent** - Detects fraud patterns, analyzes claimant history, and assesses risk factors
- **📧 Communication Agent** - Generates personalized customer emails and requests missing documentation
- **👨‍💼 Supervisor Agent** - Orchestrates the workflow and synthesizes final recommendations

### Agent Behaviors & Capabilities

#### Claim Assessor
- **Multimodal Analysis**: Processes damage photos using Azure OpenAI LLMs with vision Capabilities
- **Cost Validation**: Cross-references repair estimates with vehicle specifications
- **Documentation Review**: Evaluates completeness of supporting evidence
- **Damage Assessment**: Provides detailed analysis of incident consistency

#### Policy Checker  
- **Coverage Verification**: Searches policy documents using semantic similarity
- **Multi-language Support**: Handles both English and Dutch insurance policies
- **Exclusion Analysis**: Identifies policy limitations and coverage gaps
- **Intelligent Search**: Uses vector embeddings for accurate policy matching

#### Risk Analyst
- **Fraud Detection**: Analyzes patterns indicative of fraudulent claims
- **History Analysis**: Reviews claimant's previous claim patterns
- **Risk Scoring**: Provides quantitative risk assessments
- **Red Flag Identification**: Highlights suspicious claim elements

#### Communication Agent
- **Personalized Messaging**: Crafts contextual customer communications
- **Missing Document Requests**: Generates specific requests for additional evidence
- **Professional Tone**: Maintains appropriate insurance industry language
- **Template Generation**: Creates reusable communication templates

## 🏗️ Architecture

### Technology Stack
- **Multi-Agent Framework**: agent-framework with supervisor pattern
- **AI Provider**: Azure OpenAI (GPT-4o) 
- **Backend**: FastAPI with Python 3.12
- **Frontend**: Next.js 15 with React 19 and shadcn/ui
- **Search**: FAISS vector database for policy retrieval (to be replaced with Azure AI Search in production)
- **Infrastructure**: Azure Container Apps

### System Flow
```
Claim Submission → Supervisor Agent → Parallel Agent Processing → Final Assessment
                      ↓
    ┌─────────────────┼─────────────────┐
    ▼                 ▼                 ▼
Claim Assessor    Policy Checker    Risk Analyst
    ↓                 ↓                 ▼
Image Analysis    Document Search   Fraud Detection
Cost Validation   Coverage Check    History Review
    ↓                 ↓                 ▼
    └─────────────────┼─────────────────┘
                      ▼
            Communication Agent (if needed)
                      ▼
              Human-Readable Summary
```

## 🚀 Key Features

- **Real-time Agent Collaboration**: Watch agents work together in live workflows
- **Explainable AI**: Full transparency into agent reasoning and decision paths
- **Document Intelligence**: PDF processing and semantic search across policies
- **Multimodal Processing**: Image analysis for damage assessment
- **Interactive Demos**: Individual agent testing and complete workflow simulation
- **Production Ready**: Deployed on Azure with enterprise security

## 🛠️ Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) for Python dependency management
- Azure OpenAI account (optional - falls back to mock responses)


### Environment Configuration
Create a `.env` file in the backend directory:
```env
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-large
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### Backend Setup
```bash
cd backend
uv run fastapi dev
```
The API will be available at http://localhost:8000

### Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
The frontend will be available at http://localhost:3000


## 🌐 Azure Deployment

### Prerequisites
- [Azure Developer CLI (azd)](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- Azure subscription with appropriate permissions

### Deploy to Azure Container Apps
```bash
# Login to Azure
azd auth login

# Initialize and deploy
azd up
```

This will:
1. Create Azure Container Apps environment
2. Set up container registry with managed identity
3. Deploy both frontend and backend containers
4. Configure networking and CORS policies
5. Output the deployed application URLs

### Infrastructure
The deployment creates:
- **Container Apps Environment** with consumption-based scaling
- **Azure Container Registry** for image storage
- **Managed Identity** for secure registry access
- **Log Analytics Workspace** for monitoring
- **HTTPS endpoints** with automatic SSL certificates

## 🎮 Demo Scenarios

### Individual Agent Testing
- `/agents/claim-assessor` to test damage photo analysis
- `/agents/policy-checker` to verify coverage scenarios
- `/agents/risk-analyst` for fraud detection demos
- `/agents/communication-agent` for email generation

### Complete Workflow
- Go to `/demo` for end-to-end claim processing
- Upload damage photos and watch multimodal analysis
- See agents collaborate in real-time
- Review final assessment with full reasoning

### Sample Claims
The system includes realistic test scenarios:
- Standard auto collision claim
- High-value vehicle damage
- Dutch language insurance claim

## 📚 Project Structure

```
insurance-multi-agent/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/v1/            # REST API endpoints
│   │   ├── workflow/          # Agent definitions and tools
│   │   │   ├── agents/        # Individual agent implementations
│   │   │   ├── tools.py       # Shared agent tools
│   │   │   └── supervisor.py  # Workflow orchestration
│   │   ├── core/              # Configuration and logging
│   │   └── services/          # Business logic layer
├── frontend/                   # Next.js application
│   ├── app/                   # App router pages
│   ├── components/            # Reusable UI components
│   └── lib/                   # API clients and utilities
├── infra/                     # Azure Bicep templates
└── azure.yaml                # Azure deployment configuration
```

## 🔍 Explainable AI Features

- **Decision Trees**: Visual representation of agent reasoning
- **Source Attribution**: Links decisions to specific policy documents  
- **Confidence Scoring**: Quantitative assessment of decision certainty
- **Audit Trails**: Complete log of agent interactions for compliance
- **Human Intervention Points**: Clear override capabilities for human reviewers

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with modern AI agent frameworks to demonstrate the future of insurance claim processing.**