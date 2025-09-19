## Sprint data

The data captured for each sprint is:

- Sprint name
- Link to sprint in Taskei
- Number of business days in sprint (not used in velocity currently)
- Number of people on team (not used in velocity currently)
- Number of working hours (used in velocity calculation)
  - Calculated by adding each person's total gross hours in the sprint (we currently use one week sprints), subtract on-call hours from capcacity (we assume on-call is full time job so we subtract that person's full hours out), subtract meetings and other general overhead in a day (assume 20% of their working hours. so for 20% of 40 hours is 8), subtract any PTO for any people (e.g., if Pete is on PTO on friday we subtract 8 hour).
  - See Team data and working hours calculations below
- Planned points
  - This is how many points we've had time to plan, discuss, and bring into sprint. This a calculated field. See Calculation: Planned points below
- Carry over points (total)
  - Total number of points carried over from previous sprint
  - We use remaining estimates, so if we have two tickets carried over that were a 3 and 5 point ticket, but 1 and 2 points were done, then only 5 points are counted as planned points
  - For tracking, I'm interested in knowing how much remaining carry over points we have from sprint to sprint. So, in previous example, we would have 5 unfinished points carried over and i would want to track that over time to make sure we minimize number of points carried over sprint to sprint.
- Carry over points (completed)
  - I track this to calculate number of total planned points, new work points, and number of unfinished carry over points and total points in sprint (which is what Taskei shows)
- New work points
  - This is calculated by taking total points in sprint (which is misleading if there are partially completed carry over tickets) minus total carry over points.
  - This is helpful to know what percentage of new work we're taking on sprint to sprint
- Unplanned points brought in
  - How many points came in mid-sprint. Helpul to track over time to see how much on average are our sprint interrupted and by how much
  - This is only used in percentage of work complete and for tracking on average over time
- Total points in sprint
  - This is just the number of points on all tickets + Unplanned points brought in
- Points completed
  - This is number of points completed in this sprint. It's calculated by taking total completed points - Carry over points (completed)
- Percent complete
  - This is the % of planned points completed. This is calculated by: (Points completed / Planned points) \* 100
  - This can be over 100% if there were unplanned points brought into sprint and completed on top of all planned points being completed
- Velocity (pts : working hour)
  - This is the base velcocity number used to forecaset capacity in upcoming sprint and tracked over time. It's calculated by: Points completed / Number of working hours
  - This is generally a small decimal (e.g., .10833)
- Predicted capacity
  - This is the forecasted point budget for the this sprint based on average velocity of previous X number of sprints. I'd like to be able to dynamically calculate this based on previous sprint velocity and then average sprint velocity over X number of sprints (X being user specified number of previous sprints starting from previous week and working backwards.)

### Calculation: Planned points

Planned points are calculated by:

Total points in sprint - Carry over points already completed

### Team data and working hours calculations (tabular):

```
Person	Total Gross Hours	Less: On Call	Less: Meetings	Less: Time Off	Net Hours
Eric 	40	0	8	0	32
Eron 	40	40	0	0	0
Pete	40	0	8	8	24
Nikita	40	0	8	0	32
Kent	40	0	8	0	32
Total	200				120
```
