from fastapi import FastAPI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_community.llms import OpenAI
from pydantic import BaseModel
import os

app = FastAPI()

# Load environment variables
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY", "")

# Define request models
class CourseRecommendationRequest(BaseModel):
    student_id: str
    watched_courses: list[str]
    interests: list[str]

class TeacherRecommendationRequest(BaseModel):
    course_id: str
    student_feedback: list[str]

# Initialize LLM
llm = OpenAI(temperature=0.7)

# Recommendation prompt templates
student_prompt = PromptTemplate(
    input_variables=["interests", "watched_courses"],
    template="""Based on a student who has watched {watched_courses} and 
    has interests in {interests}, recommend 3 courses they would like.
    Return only course titles separated by commas."""
)

teacher_prompt = PromptTemplate(
    input_variables=["course_id", "student_feedback"],
    template="""For course {course_id}, students provided this feedback: 
    {student_feedback}. Suggest 3 improvements to tailor the course better.
    Return concise suggestions separated by commas."""
)

# Create chains
student_chain = LLMChain(llm=llm, prompt=student_prompt)
teacher_chain = LLMChain(llm=llm, prompt=teacher_prompt)

@app.post("/recommend/student")
async def recommend_student_courses(request: CourseRecommendationRequest):
    """Recommend courses for a student based on interests and watched history"""
    recommendations = student_chain.run({
        "interests": request.interests,
        "watched_courses": request.watched_courses
    })
    return {"recommendations": recommendations.split(", ")}

@app.post("/recommend/teacher")
async def recommend_teacher_improvements(request: TeacherRecommendationRequest):
    """Provide course improvement suggestions for teachers"""
    suggestions = teacher_chain.run({
        "course_id": request.course_id,
        "student_feedback": request.student_feedback
    })
    return {"suggestions": suggestions.split(", ")}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)