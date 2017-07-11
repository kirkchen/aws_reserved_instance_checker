# AWS Reserved Instance Checker
[![CircleCI](https://circleci.com/gh/kirkchen/aws_reserved_instance_checker.svg?style=shield)](https://circleci.com/gh/kirkchen/aws_reserved_instance_checker)
[![codecov](https://codecov.io/gh/kirkchen/aws_reserved_instance_checker/branch/master/graph/badge.svg)](https://codecov.io/gh/kirkchen/aws_reserved_instance_checker)
[![npm version](https://badge.fury.io/js/aws_reserved_instance_checker.svg)](https://badge.fury.io/js/aws_reserved_instance_checker)

Check is there any resource not included in active reserved instances and send notification to slack.

## How to use

1. Install AWS Reserved Instance Checker

    ``` bash
    $ npm install -g aws_reserved_instance_checker
    ```

1. Run 

    ``` bash
    $ export AWS_ACCESS_KEY_ID={YOUR AWS ACCESS KEY ID}
    $ export AWS_SECRET_ACCESS_KEY={YOUR AWS SECRET KEY}
    $ export RICHECKER_WEBHOOK_URL={YOUR SLACK WEBHOOK URL}
    $ export RICHECKER_REGION={YOUR AWS REGION (default: us-east-1)}    # Optional
    $ export RICHECKER_SLACK_CHANNEL={YOUR SLACK CHANNEL}               # Optional
    $ aws_reserved_instance_checker
    ```

## Todo

- Supports
    - [x] EC2
    - [ ] RDS
    - [ ] ElastiCache