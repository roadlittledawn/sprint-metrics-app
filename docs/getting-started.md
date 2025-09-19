# Getting Started with Sprint Data Tracker

Sprint Data Tracker is a comprehensive web application for tracking and analyzing your team's sprint performance with detailed metrics and forecasting capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation & Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the Development Server**

   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open your browser and navigate to: **http://localhost:3000** (or the port shown in your terminal)
   - You'll see the main dashboard

## 📋 Initial Setup Guide

### Step 1: Add Team Members

Before tracking sprints, you need to set up your team:

1. **Navigate to Admin Page**

   - Click "Admin" in the navigation or go to `/admin`

2. **Add Your First Team Member**

   - Click "Add Team Member" or "Add First Team Member"
   - Fill out the team member details:

   | Field                 | Description                      | Example        |
   | --------------------- | -------------------------------- | -------------- |
   | **Name**              | Team member's full name          | "John Doe"     |
   | **Total Gross Hours** | Total hours available per sprint | 40 (full-time) |
   | **On-Call Hours**     | Hours spent on-call duties       | 8              |
   | **Meeting Hours**     | Hours in meetings (optional)     | 8              |
   | **Time Off Hours**    | Hours for vacation/sick time     | 0              |

   > **Note**: Net Hours will be calculated automatically: `Total Gross - On-Call - Meetings - Time Off`

3. **Add Multiple Team Members**
   - Repeat for each team member
   - You can edit or remove members later as needed

### Step 2: Create Your First Sprint

1. **In the Admin Page**

   - Scroll down to the "Sprint Management" section
   - Click "Add New Sprint"

2. **Fill Out Sprint Details**

   | Field | Description | Example |
   | --- | --- | --- |
   | **Sprint Name** | Descriptive name for the sprint | "Sprint 1 - User Authentication" |
   | **Taskei Link** | Link to project management tool (optional) | https://taskei.com/sprint/1 |
   | **Business Days** | Number of working days | 10 |
   | **Total Points in Sprint** | Story points planned | 30 |
   | **Carry Over Points Total** | Points from previous sprint | 5 |
   | **Carry Over Points Completed** | Completed carry-over points | 3 |
   | **Unplanned Points** | Points added during sprint | 2 |
   | **Points Completed** | Total points actually completed | 28 |

3. **Review Calculated Metrics**

   The app automatically calculates:

   - **Working Hours**: Based on your team setup
   - **Planned Points**: Total Points - Carry Over Completed
   - **New Work Points**: Total Points - Carry Over Total
   - **Percent Complete**: (Points Completed / Planned Points) × 100
   - **Velocity**: Points Completed / Working Hours

4. **Save the Sprint**
   - Click "Save Sprint" to store the data

### Step 3: View Dashboard Metrics

1. **Navigate to Dashboard**

   - Click "Dashboard" in navigation or go to `/`

2. **Review Key Metrics**
   - **Current Sprint Status**: Latest sprint performance
   - **Average Velocity**: Team's points per hour over time
   - **Forecasted Capacity**: Predicted points for next sprint
   - **Capacity Utilization**: How efficiently you're using team capacity
   - **Sprint Completion Rate**: Average completion percentage
   - **Points per Hour**: Team efficiency metric

## 🎯 Key Features

### Dashboard Features

- ✅ **Real-time Metrics**: Live calculation of team performance
- ✅ **Trend Analysis**: See if velocity is improving or declining
- ✅ **Forecasting**: Predict capacity for upcoming sprints
- ✅ **Visual Charts**: Easy-to-read performance indicators
- ✅ **Empty States**: Helpful guidance when no data exists

### Team Management

- ✅ **Flexible Team Setup**: Handle part-time, on-call, and varying schedules
- ✅ **Automatic Calculations**: Working hours computed from team data
- ✅ **Easy Updates**: Modify team as people join/leave
- ✅ **Validation**: Built-in checks for data accuracy

### Sprint Tracking

- ✅ **Comprehensive Data**: Track all aspects of sprint performance
- ✅ **Carry-over Handling**: Properly account for work from previous sprints
- ✅ **History Management**: Keep track of all past sprints
- ✅ **Search & Filter**: Find specific sprints quickly

### User Experience

- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Keyboard Navigation**: Full accessibility support
- ✅ **Loading States**: Smooth loading indicators
- ✅ **Confirmation Dialogs**: Prevent accidental data loss
- ✅ **Error Handling**: Clear error messages and recovery options

## 🔄 Typical Workflow

### One-Time Setup

1. Add all team members with their working hour details
2. Configure default meeting percentage if needed
3. Set up any team-specific settings

### Per Sprint Process

1. **Sprint Planning**: Create new sprint with planned points
2. **During Sprint**: Update with any scope changes
3. **Sprint End**: Update with actual completion data
4. **Review**: Analyze metrics and trends on dashboard

### Ongoing Management

- Monitor dashboard for team performance trends
- Use forecasting data for future sprint planning
- Adjust team setup when schedules change
- Export data for reporting or backup

## 💡 Pro Tips

### Getting Accurate Data

- **Start Simple**: Begin with basic data, add complexity over time
- **Regular Updates**: Update sprint data promptly for accurate metrics
- **Consistent Tracking**: Use the same criteria for story point estimation

### Using Metrics Effectively

- **Monitor Trends**: Watch for velocity changes to identify issues early
- **Use Forecasting**: Let the app predict capacity for better planning
- **Team Retrospectives**: Use metrics data in sprint retrospectives

### Team Management

- **Update Regularly**: Keep team member hours current
- **Account for Changes**: Update when people join/leave or change schedules
- **Meeting Time**: Track actual meeting time vs. estimates

## 🛠 Advanced Features

### Data Management

- **Local Storage**: Data is saved locally in JSON files in the `data/` directory
- **Export/Import**: Backup and restore your data (feature coming soon)
- **Data Validation**: Built-in checks ensure data integrity

### Calculations

- **Velocity Tracking**: Points per hour over configurable time periods
- **Forecasting**: Predictive capacity based on historical performance
- **Trend Analysis**: Identify improving, declining, or stable performance

### Accessibility

- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Readers**: ARIA labels and semantic HTML
- **Skip Links**: Quick navigation for assistive technologies

## 🔧 Configuration

### Team Settings

- **Default Meeting Percentage**: Set organization-wide meeting time percentage
- **Velocity Calculation Period**: Configure how many sprints to use for averages

### Sprint Settings

- **Business Days**: Adjust default sprint length
- **Point Estimation**: Use consistent story point scales

## 📊 Understanding Metrics

### Key Calculations

| Metric | Formula | Purpose |
| --- | --- | --- |
| **Planned Points** | Total Points - Carry Over Completed | New work planned |
| **New Work Points** | Total Points - Carry Over Total | Fresh work in sprint |
| **Velocity** | Points Completed ÷ Working Hours | Team efficiency |
| **Capacity Utilization** | (Points Completed ÷ Planned Points) × 100 | Planning accuracy |

### Forecasting Quality

| Quality Level    | Description | Recommendation                |
| ---------------- | ----------- | ----------------------------- |
| **Insufficient** | < 2 sprints | Complete more sprints         |
| **Limited**      | 2-3 sprints | Predictions may be unreliable |
| **Good**         | 4-5 sprints | Reasonable accuracy           |
| **Excellent**    | 6+ sprints  | High confidence predictions   |

## 🚨 Troubleshooting

### Common Issues

**Dashboard shows "No Sprint Data"**

- Solution: Create your first sprint in the Admin section

**Metrics seem incorrect**

- Check team member working hours are accurate
- Verify sprint data entry (especially carry-over points)
- Ensure consistent story point estimation

**App won't start**

- Run `npm install` to ensure dependencies are installed
- Check that port 3000 is available
- Review console for error messages

### Getting Help

1. Check this documentation first
2. Review the in-app help text and empty states
3. Verify your data entry matches the expected formats
4. Check browser console for any error messages

## 🎉 You're Ready!

With your team set up and first sprint created, you're ready to start tracking your team's performance. The Sprint Data Tracker will help you:

- **Understand** your team's velocity and capacity
- **Predict** future sprint capacity more accurately
- **Identify** trends and areas for improvement
- **Make** data-driven decisions for sprint planning

Start with the basics and gradually explore more advanced features as your team becomes comfortable with the tool. Happy tracking! 🚀
