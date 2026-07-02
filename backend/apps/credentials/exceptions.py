class CredentialNotFoundException(Exception):
    def __init__(self, msg="Credential not found"):
        super().__init__(msg)


class CredentialAccessDeniedException(Exception):
    def __init__(self, msg="Access denied"):
        super().__init__(msg)


class SignatureVerificationFailedException(Exception):
    def __init__(self, msg="Signature verification failed"):
        super().__init__(msg)


class IntegrationTimeoutException(Exception):
    def __init__(self, msg="Integration request timed out"):
        super().__init__(msg)


class IntegrationConnectionException(Exception):
    def __init__(self, msg="Integration connection error"):
        super().__init__(msg)


class IntegrationErrorException(Exception):
    def __init__(self, msg="Integration error"):
        super().__init__(msg)


class InvalidStatusTransitionException(Exception):
    def __init__(self, msg="Invalid status transition"):
        super().__init__(msg)


class OrganizationNotTrustedException(Exception):
    def __init__(self, msg="Organization is not trusted"):
        super().__init__(msg)
