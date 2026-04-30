//@Component 
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function EmojiError(){
    return (
        <MDBox pt={3} className="css-1r8h6m1">
            <MDTypography component="div" style={{color:"#dadce0", textAlign:"center", marginTop:"0.3em", font:"200px/1.25 Google Sans,Helvetica Neue,sans-serif"}}>{"(o^^)o"}</MDTypography>
            <MDTypography component="div" style={{color:"#dadce0", textAlign:"center", marginTop:"2em", fontSize: "0.86em", font:"Google Sans,Helvetica Neue,sans-serif"}}>Ops!, Sembra che ci sia stato un problema di connessione al Server, Riprova piu tardi</MDTypography>
        </MDBox>
    )
}
export default EmojiError;