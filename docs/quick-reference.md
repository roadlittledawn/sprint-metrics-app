# Quick Reference Guide

This guide provides quick answers to common tasks and questions when using Sprint Data Tracker.

## 🚀 Quick Actions

### Starting the App

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### First Time Setup

1. Go to `/admin`
2. Add team members
3. Create your first sprint
4. View dashboard at `/`

## 👥 Team Management

### Adding a Team Member

1. Admin → Add Team Member
2. Fill required fields:
   - Name (required)
   - Total Gross Hours (required)
   - On-Call Hours, Meeting Hours, Time Off Hours (optional)
3. Net Hours calculated automatically
4. Save Member

### Editing Team Members

1. Admin → Team Management
2. Click "Edit" next to member name
3. Update fields as needed
4. Save changes

### Removing Team Members

1. Admin → Team Management
2. Click "Remove" next to member name
3. Confirm deletion in dialog

## 📊 Sprint Management

### Creating a Sprint

1. Admin → Add New Sprint
2. Required fields:
   - Sprint Name
   - Total Points in Sprint
   - Points Completed
3. Optional fields:
   - Taskei Link
   - Carry Over Points (Total & Completed)
   - Unplanned Points
4. Review calculated metrics
5. Save Sprint

### Editing Sprints

1. Admin → Sprint History
2. Click "Edit" next to sprint
3. Update fields
4. Save changes

### Deleting Sprints

1. Admin → Sprint History
2. Click "Delete" next to sprint
3. Confirm deletion

## 📈 Understanding Metrics

### Key Formulas

| Metric           | Formula                                     |
| ---------------- | ------------------------------------------- |
| Net Hours        | Gross Hours - On-Call - Meetings - Time Off |
| Working Hours    | Sum of all team member Net Hours            |
| Planned Points   | Total Points - Carry Over Completed         |
| New Work Points  | Total Points - Carry Over Total             |
| Points Completed | Total Completed - Carry Over Completed      |
| Velocity         | Points Completed ÷ Working Hours            |
| Percent Complete | (Points Completed ÷ Planned Points) × 100   |

### Dashboard Metrics

| Card | Shows | Calculation |
| --- | --- | --- |
| Current Sprint Status | Latest sprint info | Most recent sprint data |
| Average Velocity | Points/hour over time | Average of last 6 sprints |
| Forecasted Capacity | Predicted next sprint | Avg Velocity × Planned Hours |
| Capacity Utilization | Team efficiency | Average completion rate |
| Sprint Completion Rate | Success rate | Average percent complete |
| Points per Hour | Team productivity | Current velocity |

## 🔧 Common Tasks

### Updating Team Hours

When someone's schedule changes:

1. Admin → Team Management
2. Edit the team member
3. Update their hours
4. Future sprints will use new hours

### Handling Part-Time Team Members

1. Set Total Gross Hours to their actual hours (e.g., 20 for half-time)
2. Adjust Meeting Hours proportionally
3. Net Hours will calculate correctly

### Managing On-Call Rotations

1. Update team member's On-Call Hours when they're on rotation
2. Reduce to 0 when rotation ends
3. Sprint capacity adjusts automatically

### Sprint Planning with Forecasting

1. Check Dashboard → Forecasted Capacity
2. Use predicted points as starting point
3. Adjust based on team changes or priorities
4. Create sprint with planned points

## 🎯 Best Practices

### Data Entry

- ✅ Be consistent with story point estimation
- ✅ Update sprint data promptly after sprint ends
- ✅ Keep team member hours current
- ✅ Use descriptive sprint names

### Team Setup

- ✅ Include all team members who contribute to sprints
- ✅ Account for meetings, on-call, and time off realistically
- ✅ Update hours when schedules change
- ✅ Use actual working hours, not contracted hours

### Sprint Tracking

- ✅ Track carry-over work separately
- ✅ Record unplanned work that gets added
- ✅ Be honest about completion rates
- ✅ Include all work that contributes to velocity

## 🚨 Troubleshooting

### Common Issues

**"No Sprint Data Available"**

- Create your first sprint in Admin section

**Velocity seems too high/low**

- Check team working hours are realistic
- Verify story point scale is consistent
- Ensure carry-over points are tracked correctly

**Forecasting shows "Insufficient Data"**

- Need at least 2-3 sprints for predictions
- Create more sprints to improve accuracy

**Team member shows 0 net hours**

- Check that deductions (on-call + meetings + time off) don't exceed gross hours
- Adjust hours to be realistic

**Dashboard metrics not updating**

- Refresh the page
- Check that sprint data was saved correctly
- Verify team member data is current

### Validation Errors

**"Sprint name is required"**

- Enter a descriptive name for the sprint

**"Points cannot be negative"**

- Ensure all point values are 0 or positive

**"Carry over completed cannot exceed carry over total"**

- Completed carry-over points must be ≤ total carry-over points

**"At least one team member must be selected"**

- Add team members before creating sprints

## 📱 Keyboard Shortcuts

### Navigation

- `Tab` - Move between interactive elements
- `Enter` - Activate buttons and links
- `Escape` - Close dialogs and menus
- `Arrow Keys` - Navigate dropdown menus

### Forms

- `Tab` - Move between form fields
- `Enter` - Submit forms
- `Escape` - Cancel form editing

## 🔄 Typical Workflows

### Weekly Sprint Review

1. Go to Admin → Sprint History
2. Find completed sprint
3. Click "Edit"
4. Update final completion data
5. Save changes
6. Review Dashboard for trends

### Monthly Team Updates

1. Admin → Team Management
2. Review each team member's hours
3. Update any schedule changes
4. Check Dashboard forecasting accuracy
5. Adjust planning based on trends

### Sprint Planning Session

1. Check Dashboard → Forecasted Capacity
2. Review recent velocity trends
3. Plan sprint points based on forecast
4. Create new sprint in Admin
5. Monitor progress during sprint

## 💡 Pro Tips

- **Use consistent story point scales** across all sprints
- **Update data immediately** after sprint ceremonies
- **Review trends monthly** to identify patterns
- **Adjust forecasts** based on upcoming team changes
- **Export data regularly** for backup (feature coming soon)
- **Use sprint names** that clearly identify the work focus
- **Track meeting time accurately** to improve capacity planning

## 📞 Quick Help

Need immediate help? Check these resources:

1. **In-app guidance**: Look for help text and empty states
2. **Validation messages**: Red error text shows what needs fixing
3. **Confirmation dialogs**: Prevent accidental data loss
4. **Loading states**: Show when operations are in progress

Remember: The app is designed to guide you through each process with helpful prompts and validation!
