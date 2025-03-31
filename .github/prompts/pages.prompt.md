This prompt specify the development requirements for each management pages

The coding style follow SOLID principles, ensure that no functionalities overlap with others.

The primary lanuage is Vietnamese

Each CMS page manage different contents of the system. Some pages is editable, some is read-only.

## CMS Reusable Component

### Table:
- Each page has a table. The table supports pagination, filter, sort attributes.
- For **editable** pages, each table record will have action buttons: edit, delete
 - When click on delete, it will remove the record
 - WHen click on edit, the record row will change to edit mode. The action buttons will now contain confirm and cancel button.
 - On mobile devices, the table can be very narrow, even with overflow-scroll. Therefore, it is recommended to more horizontal-screen friendly component, such as stacked `Card`.

### Create form

- THis form will create new instance depends on the page
- Only display fow editable pages and with authorized user, including `admin` and `superadmin`.

### Card

- This is only shown only mobile screen.
- WHen clicked on the card, it will show the form to edit the instance informations.

## CMS Pages `src/pages/`

- `TenantPage` (only accessible by superadmin, editable): this page manage tenants
 - `name` (string): customer name
 - `created_date` (datetime): created date, follow DD/MM/YYYY
 - `disabled` (boolea):	whether the tenant is deactivated.

### `DevicePage` 

Only accessible by admin and superadmin, editable.

This page defines the devices general information and control settings

**Table:**
- `name` (string): device name
- `mac` (string): device mac address
- `tenant` (string): tenant name . This only display if the logged in user is superadmin, hide for others 
- `time_on`: `hour_on`:`minute_on`
- `time_off`: `hour_off`:`minute_off`

**Create form** / **EditForm** attributes:
- `name`
- `mac`
- `tenant` (Dropdown). Only visible for user with superadmin role.
- `hour_on` (0-24)
- `hour_off` (0-24)
- `minute_on` (0-59)
- `minute_off` (0-59)
- `auto` (boolean)
- `toggle` (boolean)

### `UsersPage.tsx` 

Only accessible by admin and superadmin, editable.

This page defines the devices general information and control settings

**Table:**
- `username` (string): username
- `email` (string): user's email
- `tenant` (string): tenant name . This only display if the logged-in user's role is superadmin, Hide for other
- `role` (Dropdown): admin: Quản trị viên, superadmin: Toàn quyền, monitor: Giám sát, operator: Vận hành
- `password` (string): user's password
- `disabled` (boolean): active by default ?

**Create form** attributes:
- `username`
- `email`
- `tenant` (Dropdown)
- `role` (Dropdown): admin: Quản trị viên, superadmin: Toàn quyền, monitor: Giám sát, operator: Vận hành
- `disabled` (boolean): active state, use Switch component