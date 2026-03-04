export type CourseContentData = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  rating: number;
  price: number;
  thumbnail: string;
  progress: number;
  enrolled: boolean;
  theme: 'light';
  userAgent: string;
  appVersion: string;
  platform: string;
};

export function generateCourseHTML(data: CourseContentData): string {
  const bgColor = '#ffffff';
  const textColor = '#1a1a1a';
  const secondaryText = '#666666';
  const cardBg = '#f5f5f5';
  const accentColor = '#0a7ea4';
  const borderColor = '#e0e0e0';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${data.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      line-height: 1.6;
      padding: 16px;
      padding-bottom: 100px;
    }
    
    .header-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .instructor {
      color: ${secondaryText};
      font-size: 16px;
      margin-bottom: 16px;
    }
    
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: ${secondaryText};
      font-size: 14px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge-enrolled {
      background-color: ${accentColor};
      color: white;
    }
    
    .badge-category {
      background-color: ${cardBg};
      color: ${textColor};
      border: 1px solid ${borderColor};
    }
    
    .section {
      margin-top: 24px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: ${textColor};
    }
    
    .description {
      color: ${secondaryText};
      font-size: 15px;
      line-height: 1.7;
    }
    
    .progress-container {
      background-color: ${cardBg};
      border-radius: 12px;
      padding: 16px;
      margin-top: 20px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    
    .progress-label {
      font-weight: 600;
    }
    
    .progress-value {
      color: ${accentColor};
      font-weight: 700;
    }
    
    .progress-bar {
      height: 8px;
      background-color: ${borderColor};
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background-color: ${accentColor};
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .curriculum {
      background-color: ${cardBg};
      border-radius: 12px;
      overflow: hidden;
    }
    
    .lesson {
      padding: 16px;
      border-bottom: 1px solid ${borderColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .lesson:last-child {
      border-bottom: none;
    }
    
    .lesson-title {
      font-size: 15px;
      font-weight: 500;
    }
    
    .lesson-duration {
      color: ${secondaryText};
      font-size: 13px;
    }
    
    .lesson-status {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    
    .lesson-completed {
      background-color: ${accentColor};
      color: white;
    }
    
    .lesson-pending {
      border: 2px solid ${borderColor};
    }
    
    .info-card {
      background-color: ${cardBg};
      border-radius: 12px;
      padding: 16px;
      margin-top: 12px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid ${borderColor};
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: ${secondaryText};
      font-size: 14px;
    }
    
    .info-value {
      font-weight: 500;
      font-size: 14px;
    }
    
    .native-data {
      margin-top: 24px;
      padding: 16px;
      background-color: ${cardBg};
      border-radius: 12px;
      border-left: 4px solid ${accentColor};
    }
    
    .native-data-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: ${accentColor};
    }
    
    .native-data-item {
      font-size: 12px;
      color: ${secondaryText};
      margin: 4px 0;
    }
    
    .button {
      display: block;
      width: 100%;
      padding: 16px;
      background-color: ${accentColor};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      text-align: center;
    }
    
    .button:active {
      opacity: 0.9;
    }

    @media (max-width: 360px) {
      .title {
        font-size: 20px;
      }
      .header-image {
        height: 160px;
      }
    }
  </style>
</head>
<body>
  <img src="${data.thumbnail}" alt="${data.title}" class="header-image" onerror="this.style.display='none'">
  
  <h1 class="title">${data.title}</h1>
  <p class="instructor">by ${data.instructor}</p>
  
  <div class="meta-row">
    <span class="badge badge-category">${data.category}</span>
    ${data.enrolled ? '<span class="badge badge-enrolled">✓ Enrolled</span>' : ''}
    <span class="meta-item">⭐ ${data.rating.toFixed(1)}</span>
    <span class="meta-item">$${data.price.toFixed(2)}</span>
  </div>

  ${data.enrolled ? `
  <div class="progress-container">
    <div class="progress-header">
      <span class="progress-label">Your Progress</span>
      <span class="progress-value">${data.progress}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${data.progress}%"></div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">About this course</h2>
    <p class="description">${data.description}</p>
  </div>

  <div class="section">
    <h2 class="section-title">Course Curriculum</h2>
    <div class="curriculum">
      <div class="lesson">
        <div>
          <div class="lesson-title">1. Introduction</div>
          <div class="lesson-duration">5 min</div>
        </div>
        <div class="lesson-status ${data.progress >= 25 ? 'lesson-completed' : 'lesson-pending'}">
          ${data.progress >= 25 ? '✓' : ''}
        </div>
      </div>
      <div class="lesson">
        <div>
          <div class="lesson-title">2. Getting Started</div>
          <div class="lesson-duration">15 min</div>
        </div>
        <div class="lesson-status ${data.progress >= 50 ? 'lesson-completed' : 'lesson-pending'}">
          ${data.progress >= 50 ? '✓' : ''}
        </div>
      </div>
      <div class="lesson">
        <div>
          <div class="lesson-title">3. Core Concepts</div>
          <div class="lesson-duration">30 min</div>
        </div>
        <div class="lesson-status ${data.progress >= 75 ? 'lesson-completed' : 'lesson-pending'}">
          ${data.progress >= 75 ? '✓' : ''}
        </div>
      </div>
      <div class="lesson">
        <div>
          <div class="lesson-title">4. Advanced Topics</div>
          <div class="lesson-duration">45 min</div>
        </div>
        <div class="lesson-status ${data.progress >= 100 ? 'lesson-completed' : 'lesson-pending'}">
          ${data.progress >= 100 ? '✓' : ''}
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Course Info</h2>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Course ID</span>
        <span class="info-value">${data.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Category</span>
        <span class="info-value">${data.category}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Duration</span>
        <span class="info-value">~1.5 hours</span>
      </div>
      <div class="info-row">
        <span class="info-label">Difficulty</span>
        <span class="info-value">Intermediate</span>
      </div>
    </div>
  </div>

  <div class="native-data">
    <div class="native-data-title">Native App Headers</div>
    <div class="native-data-item">Platform: ${data.platform}</div>
    <div class="native-data-item">App Version: ${data.appVersion}</div>
    <div class="native-data-item">User Agent: ${data.userAgent}</div>
    <div class="native-data-item">Theme: ${data.theme}</div>
  </div>

  <button class="button" onclick="sendMessageToNative('continue')">
    ${data.enrolled ? 'Continue Learning' : 'Start Course'}
  </button>

  <script>
    window.courseData = ${JSON.stringify(data)};
    
    function sendMessageToNative(action) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: action,
          courseId: '${data.id}',
          timestamp: Date.now()
        }));
      }
    }

    function updateProgress(newProgress) {
      const fill = document.querySelector('.progress-fill');
      const value = document.querySelector('.progress-value');
      if (fill && value) {
        fill.style.width = newProgress + '%';
        value.textContent = newProgress + '%';
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      console.log('Course content loaded:', window.courseData.title);
    });
  </script>
</body>
</html>
`;
}
