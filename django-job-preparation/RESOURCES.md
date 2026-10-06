# Django Job Preparation Resources

## Knowledge

- [Django tutorial, part 1 — official documentation](https://docs.djangoproject.com/en/stable/intro/tutorial01/)
  The primary, example-driven path for understanding project structure, `manage.py`, settings, URL declarations, and the first application. Use it to ground terminology and verify commands against the Django version being used.
- [URL dispatcher — official Django documentation](https://docs.djangoproject.com/en/stable/topics/http/urls/)
  The authoritative request-routing model: Django loads the root URLconf, checks `urlpatterns` in order, stops at the first match, and calls the matched view. Use it for request-lifecycle and routing explanations.
- [Writing views — official Django documentation](https://docs.djangoproject.com/en/stable/topics/http/views/)
  Defines a view as code that receives a request and returns a response, including HTML, redirects, errors, or other response types. Use it to avoid the common mistake of equating a view with a template.
- [Models — official Django documentation](https://docs.djangoproject.com/en/stable/topics/db/models/)
  Covers the model-to-database-table mapping, fields, relationships, and Django's generated database API. Use it for ORM and data-model interview preparation.
- [Writing and running tests — official Django documentation](https://docs.djangoproject.com/en/stable/topics/testing/overview/)
  Explains Django's test support and `django.test.TestCase`, including isolation and the relationship to Python's `unittest`. Use it when practicing test design and testability questions.
- [Security in Django — official documentation](https://docs.djangoproject.com/en/stable/topics/security/)
  The framework's security guidance and threat-oriented protections. Use it for CSRF, XSS, SQL injection, clickjacking, HTTPS, and secure deployment discussions.
- [Deployment checklist — official Django documentation](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
  A production-readiness checklist for settings, secrets, static files, error reporting, and deployment review. Use it for practical interview questions about taking a Django app beyond development.
- [Django REST framework quickstart](https://www.django-rest-framework.org/tutorial/quickstart/)
  The official DRF tutorial for serializers, viewsets, routers, and API authentication. Use after core Django request, model, and testing concepts are stable.
- [The Python tutorial — official Python documentation](https://docs.python.org/3/tutorial/)
  The trusted reference for Python concepts Django interviews assume: modules, classes, exceptions, data structures, and virtual environments.
- [Virtual environments — official Python documentation](https://docs.python.org/3/library/venv.html)
  The reference for isolated Python environments. Use when discussing reproducible local setup and dependency boundaries.

## Wisdom (Communities)

- [Django Forum](https://forum.djangoproject.com/)
  The official community forum, useful for seeing how experienced Django developers reason about design, upgrades, and debugging in real projects.
- [django-users group](https://groups.google.com/g/django-users)
  A long-running Django user community. Use it to compare approaches and find explanations for framework behavior that official reference pages do not illustrate.

## Gaps

- There is no target job description yet, so the resource set is intentionally general rather than employer-specific.
- Later, add one project-specific resource set for the database, hosting platform, and API conventions used in the user's portfolio project.
