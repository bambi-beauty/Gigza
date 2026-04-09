import React, { useState, useRef } from "react";
import styled from "styled-components";

function Verification({ goToSuccess }) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const inputsRef = useRef([]);

  
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

   
    if (value && index < 3) {
      inputsRef.current[index + 1].focus();
    }
  };

  
  const handleVerify = (e) => {
    e.preventDefault();

    const enteredCode = code.join("");
    const savedCode = localStorage.getItem("verificationCode");

    if (enteredCode === savedCode) {
      setError("");
      alert("Verification successful");
      goToSuccess(); 
    } else {
      setError("The code you entered is incorrect. Try again.");
    }
  };


  const handleResend = () => {
    alert("Resending code...");

   
  };

  return (
    <Container>
      <Card>
        <Logo>Gigza</Logo>

        <Title>Verify your email</Title>
        <Subtitle>
          Enter the 4-digit code sent to your email
        </Subtitle>

        <Form onSubmit={handleVerify}>
          
          {}
          <CodeContainer>
            {code.map((digit, index) => (
              <CodeInput
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
                ref={(el) => (inputsRef.current[index] = el)}
              />
            ))}
          </CodeContainer>

          {}
          {error && <ErrorText>{error}</ErrorText>}

          {}
          <Button type="submit">Verify</Button>

          {}
          <ResendText onClick={handleResend}>
            Didn’t receive code? Resend
          </ResendText>

        </Form>
      </Card>
    </Container>
  );
}

export default Verification;




const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5;
`;
const Form = styled.form`
  width: 100%;
`;
const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
  width: 320px;
`;

const Logo = styled.h1`
  margin-bottom: 8px;
  font-size: 22px;
`;

const Title = styled.h2`
  margin-bottom: 16px;
  font-size: 18px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #777;
  margin-bottom: 20px;
`;

const CodeContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
`;

const CodeInput = styled.input`
  width: 40px;
  height: 45px;
  text-align: center;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 6px;
  outline: none;

  &:focus {
    border-color: black;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  background: black;
  color: white;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #333;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 12px;
  margin-bottom: 10px;
`;

const ResendText = styled.p`
  margin-top: 12px;
  font-size: 12px;
  color: #555;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;