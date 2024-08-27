FROM public.ecr.aws/lambda/nodejs:20.2024.07.10.10

# Copy package.json and package-lock.json
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install the specified packages
RUN npm install

# Copy function code
COPY . ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]