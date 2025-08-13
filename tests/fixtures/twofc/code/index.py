# -*- coding: utf-8 -*-

import logging
import os


def handler(event, context):

    env_var = os.environ.get('MY_VIRABLE')

    logger = logging.getLogger()
    logger.info(event)
    return f"twofc {env_var}"
