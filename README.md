# AWS Reserved Instance Checker
[![CircleCI](https://circleci.com/gh/kirkchen/aws_reserved_instance_checker.svg?style=shield)](https://circleci.com/gh/kirkchen/aws_reserved_instance_checker)
[![codecov](https://codecov.io/gh/kirkchen/aws_reserved_instance_checker/branch/master/graph/badge.svg)](https://codecov.io/gh/kirkchen/aws_reserved_instance_checker)

Check is there any resource not included in active reserved instances and send notification to slack.

## How to use

1. Clone this repo

    ``` bash
    $ git clone git@github.com:kirkchen/aws_reserved_instance_checker.git
    ```

1. Install dependencies && Build

    ``` bash
    $ npm install
    $ npm build
    ```

1. Run 

    ``` bash
    $ export AWS_ACCESS_KEY_ID={YOUR AWS ACCESS KEY ID}
    $ export AWS_SECRET_ACCESS_KEY={YOUR AWS SECRET KEY}
    $ export RICHECKER_WEBHOOK_URL={YOUR SLACK WEBHOOK URL}
    $ export RICHECKER_REGION={YOUR AWS REGION (default: us-east-1)}
    $ npm start
    ```

## Todo

- Supports
    - [x] EC2
    - [ ] RDS
    - [ ] ElastiCache