using System;
using System.Windows.Forms;
using System.IO;
using System.Threading;
using System.Net.Http;

namespace RequestTester
{
    public partial class MainWindow : Form
    {
        private string actualPath = "C:/";

        public MainWindow()
        {
            InitializeComponent();
            this.FormBorderStyle = FormBorderStyle.FixedToolWindow;
        }

        private void CreateTree()
        {
            new Thread(() =>
            {

                this.BeginInvoke(new MethodInvoker(delegate
                {
                    this.treeView1.Nodes.Clear();
                }));

                foreach (string folder in Directory.GetDirectories(actualPath))
                {
                    this.BeginInvoke(new MethodInvoker(delegate
                    {
                        int index = this.treeView1.Nodes.Count;
                        int length = Path.GetFileName(folder).Length > 10 ? 10 : Path.GetFileName(folder).Length;
                        this.treeView1.Nodes.Add(Path.GetFileName(folder).Substring(0, length));
                        foreach (string file in Directory.GetFiles(actualPath))
                        {
                            length = Path.GetFileName(file).Length > 10 ? 10 : Path.GetFileName(file).Length;
                            this.treeView1.Nodes[index].Nodes.Add(Path.GetFileName(file).Substring(0, length));
                        }
                    }));
                }

                foreach (string file in Directory.GetFiles(actualPath))
                {
                    this.BeginInvoke(new MethodInvoker(delegate
                    {
                        if (Path.GetFileName(file) != "")
                        {
                            int length = Path.GetFileName(file).Length > 10 ? 10 : Path.GetFileName(file).Length;
                            this.treeView1.Nodes.Add(Path.GetFileName(file).Substring(0, length));
                        }
                    }));
                }
            }).Start();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            FolderBrowserDialog dialog = new FolderBrowserDialog();
            if (DialogResult.OK == dialog.ShowDialog())
            {
                actualPath = dialog.SelectedPath;
                this.CreateTree();
            }
        }

        private void button2_Click(object sender, EventArgs e)
        {
            string d = this.textBox2.Text;
            string url = this.textBox1.Text;
            int delay = 5000;
            try
            {
                delay = int.Parse(d);
            }
            catch (Exception)
            { }
            new Thread(async () =>
            {
                try
                {
                    int msStart = DateTime.Now.Millisecond;
                    string dir = this.GetOuputFolder();
                    HttpClient client = new HttpClient();
                    client.Timeout = TimeSpan.FromMilliseconds((double)delay);
                    HttpResponseMessage res = await client.GetAsync(url);
                    string resContent = await res.Content.ReadAsStringAsync();
                    int msStop = DateTime.Now.Millisecond;
                    
                    string content = url + "\nDuration: " + Math.Abs((msStart - msStop)) + " ms\nStatusCode:" + res.StatusCode + "\nVersion: " + res.Version + "\nReasonPhrase: " + res.ReasonPhrase + "\n Headers:\n[\n" + res.Headers + "]\n Content:" + resContent + "\nRequestMessage:" + res.RequestMessage;
                    File.WriteAllText(Path.Combine(dir, ValidFileName(url) + ".log"), content);

                    this.BeginInvoke(new MethodInvoker(delegate
                    {
                        this.label3.Text = "Duration:" + Math.Abs((msStart - msStop)) + " ms";
                        this.label4.Text = "Status: " + res.StatusCode.ToString();
                        this.label5.Text = "Version: HTTP/" + res.Version.ToString();
                        this.label6.Text = "Output folder name: .http";
                    }));
                }
                catch { }
            }).Start();
        }

        private string ValidFileName(string name)
        {
            string invalidChars = System.Text.RegularExpressions.Regex.Escape(new string(Path.GetInvalidFileNameChars()));
            string invalidRegStr = string.Format(@"([{0}]*\.+$)|([{0}]+)", invalidChars);

            return System.Text.RegularExpressions.Regex.Replace(name, invalidRegStr, ".");
        }

        private string GetOuputFolder()
        {
            if (!Directory.Exists(Path.Combine(this.actualPath, ".http")))
            {
                Directory.CreateDirectory(Path.Combine(this.actualPath, ".http"));
            }
            return Path.Combine(this.actualPath, ".http");
        }

        private void button3_Click(object sender, EventArgs e)
        {
            Clipboard.SetText(System.Text.RegularExpressions.Regex.Replace(this.GetOuputFolder(), "/", @"\"));
        }
    }
}
