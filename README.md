# Kaseya Autotask PSA Tampermonkey scripts
Tampermonkey Script for Sound Alerts (New Ticket, Device Offline, etc.) in Autotask by Kaseya

WARNING:
These scripts are for internal use only and are provided purely as examples. They are not free from potential bugs, and everything is in Italian, with filters based on our ticket categories.

To use them, you need to create GAUGE dashboards so that when you open them in a new tab, they return a link like this:
https://ww19.autotask.net/Mvc/ServiceDesk/TicketGridWidgetDrilldown.mvc/PrimaryStandardDrilldown?ContentId=EXAMPLE*


![immagine](https://github.com/user-attachments/assets/d86f0bdc-a0c3-4c90-8149-979473e37bd1)

Of course, you will then need to insert it into the corresponding script.

The required columns for proper functioning are:
- Ticket Number
- Title
- Description
- Company
- Status
- Priority


![immagine](https://github.com/user-attachments/assets/98f4f887-e9cf-43ba-be9d-beac3c57e0da)

You also need to set your custom sounds, the refresh intervals you prefer, and enable or disable the various types of notifications.

As mentioned, given the nature of the service, each script must be customized to suit your needs.
