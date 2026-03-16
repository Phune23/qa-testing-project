# Test Summary Report

## 1. Overview

This report summarizes the testing activities performed for the E-commerce Web Application.

Testing types performed:

* Functional Testing
* API Testing
* Unit Testing
* Basic Automation Testing

---

## 2. Test Execution Summary

| Metric           | Value |
| ---------------- | ----- |
| Total Test Cases | 4     |
| Executed         | 4     |
| Passed           | 3     |
| Failed           | 1     |
| Blocked          | 0     |

Test Execution Rate: 100%

---

## 3. Bug Summary

| Severity | Count |
| -------- | ----- |
| Critical | 0     |
| High     | 1     |
| Medium   | 0     |
| Low      | 0     |

Total Bugs Found: 1

---

## 4. Major Issue Found

BUG001 – Login error message missing

Description:
When a user enters an incorrect password during login, the system does not display an error message.

Severity: High

Status: Open

---

## 5. Testing Conclusion

Most core functionalities of the system work as expected.
However, an issue was found in the login validation process where error messages are not displayed for incorrect passwords.

This issue should be fixed before production release.

Overall system stability: Acceptable with minor issues.
